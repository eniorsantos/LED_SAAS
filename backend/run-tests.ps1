$env:HOJE='2026-10-25'
$env:SEED='true'
$env:JWT_SECRET='test-secret-key-for-performance'

# Iniciar servidor em background
$proc = Start-Process -FilePath "node" -ArgumentList "src/index.js" -WorkingDirectory "E:\S_LEDS\backend" -PassThru -WindowStyle Hidden

# Aguardar servidor ficar disponível
Write-Host "Aguardando servidor iniciar..."
for ($i = 0; $i -lt 30; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method Get -TimeoutSec 2
        if ($response.ok) { break }
    } catch {}
    Start-Sleep -Milliseconds 500
}

# Rodar testes
Write-Host "Executando testes de performance, segurança e carga..."
node test/performance-security-load.js

# Parar servidor
Write-Host "Parando servidor..."
Stop-Process -Id $proc.Id -Force
