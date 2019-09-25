package main

import (
	"bytes"
	"encoding/json"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"time"

	stream "github.com/GetStream/stream-chat-go"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

type User struct {
	ID string `json:"username"`
}

type Auth struct {
	Username string `json:"username"`
	Token    []byte `json:"token"`
}

func init() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal(err)
	}
}

func DumpRequestBody(response *http.Request) string {
	var bodyBytes []byte
	if response.Body != nil {
		bodyBytes, _ = ioutil.ReadAll(response.Body)
	}

	// Restore the io.ReadCloser to its original state
	response.Body = ioutil.NopCloser(bytes.NewBuffer(bodyBytes))

	// Use the content
	bodyString := string(bodyBytes)
	return bodyString
}

func main() {
	streamAppKey := os.Getenv("STREAM_APP_KEY")
	streamAppSecret := os.Getenv("STREAM_APP_SECRET")

	client, err := stream.NewClient(
		streamAppKey,
		[]byte(streamAppSecret),
	)
	if err != nil {
		log.Fatal(err)
	}

	mux := http.NewServeMux()

	mux.HandleFunc("/join", func(w http.ResponseWriter, r *http.Request) {
		user := &User{}

		defer r.Body.Close()

		err := json.NewDecoder(r.Body).Decode(user)
		if err != nil {
			if err != io.EOF {
				log.Fatal(err)
			}
		}

		expires := time.Now().Add(3600 * time.Second)
		token, err := client.CreateToken(user.ID, expires)
		if err != nil {
			log.Fatal(err)
		}

		response := &Auth{
			Username: user.ID,
			Token:    token,
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(response)
	})

	handler := cors.Default().Handler(mux)

	log.Fatal(http.ListenAndServe(":5200", handler))
}
