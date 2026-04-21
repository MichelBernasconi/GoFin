package main

import (
	"database/sql"
	"flag"
	"fmt"
	"log"
	"os"

	_ "modernc.org/sqlite"
)

func main() {
	dbPath := flag.String("db", "gofin.db", "Path to SQLite database")
	saveCmd := flag.String("save", "", "Path to binary file to save into DB")
	loadCmd := flag.String("load", "", "Path to output binary file from DB")
	flag.Parse()

	db, err := sql.Open("sqlite", *dbPath)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Initialize tables
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS strategies (
		id TEXT PRIMARY KEY,
		name TEXT,
		content BLOB,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)`)
	if err != nil {
		log.Fatalf("Failed to init tables: %v", err)
	}

	if *saveCmd != "" {
		data, err := os.ReadFile(*saveCmd)
		if err != nil {
			log.Fatalf("Failed to read input binary: %v", err)
		}
		// Logic to save into SQLite (simplified for now)
		_, err = db.Exec("INSERT OR REPLACE INTO strategies (id, name, content) VALUES (?, ?, ?)", 
			"current", "Strategy", data)
		if err != nil {
			log.Fatalf("DB Write Error: %v", err)
		}
		fmt.Println("SUCCESS: Strategy saved to SQLite")
	}

	if *loadCmd != "" {
		var content []byte
		err = db.QueryRow("SELECT content FROM strategies WHERE id = ?", "current").Scan(&content)
		if err != nil {
			if err == sql.ErrNoRows {
				fmt.Println("INFO: No data found")
				return
			}
			log.Fatalf("DB Read Error: %v", err)
		}
		err = os.WriteFile(*loadCmd, content, 0644)
		if err != nil {
			log.Fatalf("Failed to write output binary: %v", err)
		}
		fmt.Println("SUCCESS: Binary data exported from SQLite")
	}
}
