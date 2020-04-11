package main
import  (
	
	"fmt"
	"gopkg.in/gomail.v2"
	"github.com/go-redis/redis/v7"
	"os"
	log "github.com/sirupsen/logrus"
	"encoding/json"
	"crypto/aes"
	"crypto/cipher"
	"encoding/hex"
	"strconv"
	"github.com/mergermarket/go-pkcs7"
	"io/ioutil"
	"time"
)

func main() {
	log.SetLevel(log.DebugLevel)
	log.Info("Starting cronmailer")

	client := redis.NewClient(&redis.Options{
		Addr:     "redis:6379",
		Password: os.Getenv("REDIS_PASSWORD"), // no password set
		DB:       0,  // use default DB
	})

	log.Debug("Getting mails");
	val, err := client.LRange("mailer",0,-1).Result()
	if err != nil {
		log.Error("Error getting data: ",err)
	}
	log.Debug("Length of mailer: ",len(val))

	for i := 0; i < len(val); i++ {
		log.Debug("Checking item: ",val[i])
		decrypted, err := Decrypt(val[i])
		if err != nil {
			log.Error("Error when decrypting: ",err)
		}
		var js map[string]interface{}
		in := []byte(decrypted)
		if err := json.Unmarshal(in, &js); err != nil {
			log.Error("Error unmarshaling data: ",err)
		}

		now := int32(time.Now().Unix())
		i64, err := strconv.ParseInt(js["mailDate"].(string), 10, 32)
		if err != nil {
			log.Error("Error getting mailDate",err)
		}
		mailDate := int32(i64)
		
		if (mailDate < now) {
			log.Info("Sending mail now");
			err = send(js["from"].(string),js["msg"].(string))
			if err != nil {
				log.Error("Not able to send mail: ",err)
			}
			// TODO: Set list item and remove
			client.LSet("mailer",int64(i),"SENT")
			// Delete now sent item
			client.LRem("mailer",-1,"SENT")
		} else {
			log.Debug(js)
		}
	}
	time.Sleep(60 * 60 * time.Second)
	//send()
}

func Decrypt(encrypted string) (string, error) {
	key := []byte(os.Getenv("ENCRYPTION_KEY"))
	cipherText, _ := hex.DecodeString(encrypted)

	block, err := aes.NewCipher(key)
	if err != nil {
		panic(err)
	}

	if len(cipherText) < aes.BlockSize {
		panic("cipherText too short")
	}
	iv := cipherText[:aes.BlockSize]
	cipherText = cipherText[aes.BlockSize:]
	if len(cipherText)%aes.BlockSize != 0 {
		panic("cipherText is not a multiple of the block size")
	}

	mode := cipher.NewCBCDecrypter(block, iv)
	mode.CryptBlocks(cipherText, cipherText)

	cipherText, _ = pkcs7.Unpad(cipherText, aes.BlockSize)
	return fmt.Sprintf("%s", cipherText), nil
}

func send(receiver string, message string) error{

	m := gomail.NewMessage()
	m.SetHeader("From", "mail@mail2myself.org")
	m.SetHeader("To", receiver)
	m.SetHeader("Subject", "Deine Nachricht aus der Vergangenheit")

	content, err := ioutil.ReadFile("./mail_start.html");
    if err != nil {
        log.Error(err)
    }
	mailStart := string(content)
	content, err = ioutil.ReadFile("./mail_end.html");
    if err != nil {
        log.Error(err)
    }
	mailEnd := string(content)
	mailContent := mailStart + message + mailEnd

	m.SetBody("text/html",mailContent)
	d := gomail.NewDialer("mail.codebrew.de", 587, "mail@mail2myself.org", os.Getenv("MAILER_PASSWORD"))

	if err := d.DialAndSend(m); err != nil {
		fmt.Println(err)
		return err
	}
	return nil
}