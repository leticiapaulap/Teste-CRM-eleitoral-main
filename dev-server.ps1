$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = if ($env:PORT) { [int]$env:PORT } else { 5173 }
$prefix = "http://localhost:$port/"

$contentTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".js" = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".png" = "image/png"
  ".jpg" = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".svg" = "image/svg+xml"
  ".ico" = "image/x-icon"
}

function Send-Json($res, [int]$status, $obj) {
  $json = $obj | ConvertTo-Json -Depth 8
  $bytes = [Text.Encoding]::UTF8.GetBytes($json)
  $res.StatusCode = $status
  $res.ContentType = "application/json; charset=utf-8"
  $res.OutputStream.Write($bytes, 0, $bytes.Length)
}

function Send-File($res, [string]$path) {
  $ext = [IO.Path]::GetExtension($path).ToLowerInvariant()
  $bytes = [IO.File]::ReadAllBytes($path)
  $res.StatusCode = 200
  $res.ContentType = if ($contentTypes.ContainsKey($ext)) { $contentTypes[$ext] } else { "application/octet-stream" }
  $res.OutputStream.Write($bytes, 0, $bytes.Length)
}

function Read-RequestBody($req) {
  $reader = [IO.StreamReader]::new($req.InputStream, $req.ContentEncoding)
  try { $reader.ReadToEnd() } finally { $reader.Dispose() }
}

$listener = [Net.HttpListener]::new()
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "Serving $root at $prefix"

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request
  $res = $ctx.Response

  try {
    $res.Headers.Set("Access-Control-Allow-Origin", "*")
    $res.Headers.Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    $res.Headers.Set("Access-Control-Allow-Headers", "Content-Type")

    if ($req.HttpMethod -eq "OPTIONS") {
      $res.StatusCode = 200
      continue
    }

    if ($req.Url.AbsolutePath -eq "/api/siv") {
      if ($req.HttpMethod -ne "POST") {
        Send-Json $res 405 @{ ok = $false; error = "Metodo nao permitido" }
        continue
      }

      if (-not $env:SIV_APPS_SCRIPT_URL) {
        Send-Json $res 500 @{ ok = $false; error = "SIV_APPS_SCRIPT_URL nao configurado localmente." }
        continue
      }

      $body = Read-RequestBody $req
      $ip = if ($req.RemoteEndPoint) { $req.RemoteEndPoint.Address.ToString() } else { "" }
      $params = [Web.HttpUtility]::ParseQueryString($body)
      $params.Set("ip", $ip)

      $upstream = Invoke-WebRequest -Uri $env:SIV_APPS_SCRIPT_URL -Method Post -Body $params.ToString() -ContentType "application/x-www-form-urlencoded" -UseBasicParsing
      $res.StatusCode = 200
      $res.ContentType = "application/json; charset=utf-8"
      $bytes = [Text.Encoding]::UTF8.GetBytes($upstream.Content)
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
      continue
    }

    $relativePath = [Uri]::UnescapeDataString($req.Url.AbsolutePath.TrimStart("/"))
    if ([string]::IsNullOrWhiteSpace($relativePath)) { $relativePath = "index.html" }

    $fullPath = [IO.Path]::GetFullPath((Join-Path $root $relativePath))
    if (-not $fullPath.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or -not [IO.File]::Exists($fullPath)) {
      Send-Json $res 404 @{ ok = $false; error = "Arquivo nao encontrado" }
      continue
    }

    Send-File $res $fullPath
  } catch {
    Send-Json $res 500 @{ ok = $false; error = $_.Exception.Message }
  } finally {
    $res.OutputStream.Close()
  }
}
