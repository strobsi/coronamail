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

	"github.com/mergermarket/go-pkcs7"
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

	for i := 0; i < len(val); i++ {
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
		if (js["mailDate"].(int32) < now) {
			log.Info("Sending mail now");
		} 
	}
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

func send() {
	m := gomail.NewMessage()
	m.SetHeader("From", "mail@mail2myself.org")
	m.SetHeader("To", "simon.strobel@web.de")
	//m.SetAddressHeader("Cc", "dan@example.com", "Dan")
	m.SetHeader("Subject", "Hello!")
	m.SetBody("text/html", "Hello <b>Bob</b> and <i>Cora</i>!")
	
	d := gomail.NewDialer("mail.codebrew.de", 587, "mail@mail2myself.org", os.Getenv("MAILER_PASSWORD"))
	
	// Send the email to Bob, Cora and Dan.
	if err := d.DialAndSend(m); err != nil {
		fmt.Println(err)
	}
}