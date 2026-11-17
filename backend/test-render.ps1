$env:PORT='3001'
$env:JWT_SECRET='test-secret-key'
$env:DB_PATH='/data/data.db'
$env:SEED='false'
$env:HOJE=''

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

# Testar health check
Write-Host "Testando health check..."
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method Get
Write-Host "Health check: $($response.ok)"

# Testar login
Write-Host "Testando login..."
$login = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -ContentType "application/json" -Body '{"login":"admin","senha":"admin123"}'
Write-Host "Login: $($login.token.Substring(0,20))..."

# Testar dashboard
Write-Host "Testando dashboard..."
$dash = Invoke-RestMethod -Uri "http://localhost:3001/api/dashboard" -Method Get -Headers @{Authorization = "Bearer $($login.token)"}
Write-Host "Dashboard KPIs: $($dash.kpis.leds_ativos)"

# Parar servidor
Write-Host "Parando servidor..."
Stop-Process -Id $proc.Id -Force
Write-Host "Testes concluídos com sucesso!"
