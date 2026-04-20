package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os/exec"
	"time"
)

type RustManager struct {
	cmd *exec.Cmd
}

// StartBackend tenta di avviare Quantara via cargo run
func (m *RustManager) StartBackend(path string) error {
	m.cmd = exec.Command("cargo", "run")
	m.cmd.Dir = path
	return m.cmd.Start()
}

// SimulationResult aggiornato con i campi reali di Quantara
type SimulationResult struct {
	TotalReturn   float64   `json:"total_return"`
	AnnualReturn  float64   `json:"annual_return"`
	MaxDrawdown   float64   `json:"max_drawdown"`
	Volatility    float64   `json:"volatility"`
	FinalValue    float64   `json:"final_value"`
	EquityCurve   []float64 `json:"equity_curve"` // Lo prepareremo per il futuro
	ExecutionTime string    `json:"execution_time"`
}

func (a *App) RunSimulation(params map[string]interface{}) (*SimulationResult, error) {
	start := time.Now()

	// 1. In un'app reale qui invieremmo POST /data e POST /strategies
	// Per ora facciamo la chiamata al backtest (assumendo strategyId 1)
	
	quantaraUrl := "http://127.0.0.1:3000/backtest/1"
	
	jsonData, _ := json.Marshal(params)
	resp, err := http.Post(quantaraUrl, "application/json", bytes.NewBuffer(jsonData))
	
	if err != nil {
		// Se il server non risponde, restituiamo un errore o dati mock per ora
		fmt.Printf("Errore connessione a Quantara: %v. Uso dati mock.\n", err)
		return a.getMockResult(start), nil
	}
	defer resp.Body.Close()

	var result SimulationResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	result.ExecutionTime = time.Since(start).String()
	return &result, nil
}

func (a *App) getMockResult(start time.Time) *SimulationResult {
	// Fallback mock (stessa logica di prima)
	return &SimulationResult{
		TotalReturn:   24.5,
		AnnualReturn:  18.2,
		MaxDrawdown:   -8.4,
		FinalValue:    12450.0,
		EquityCurve:   []float64{10000, 10200, 10150, 10400, 10300, 10600, 10800, 10750, 11000, 11200},
		ExecutionTime: time.Since(start).String(),
	}
}
