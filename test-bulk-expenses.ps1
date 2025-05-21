# Bulk Expenses API Test (PowerShell)

# Prepare your expenses data as a PowerShell object array
$expenses = @(
    @{ date = "2025-05-17"; categoryId = 1; materialName = "Paper"; vendorName = "Stationery Shop"; amount = 100; paymentMethod = "Cash"; description = "Bulk paper purchase" },
    @{ date = "2025-05-17"; categoryId = 2; materialName = "Printer Ink"; vendorName = "Office Depot"; amount = 500; paymentMethod = "Card"; description = "Ink for printers" }
)

# Convert to JSON
$body = @{ expenses = $expenses } | ConvertTo-Json -Depth 5

# Set your API URL and authentication cookie if needed
$apiUrl = "http://localhost:3000/api/expenses/bulk"
$headers = @{ "Content-Type" = "application/json" }
# If you need authentication, add a Cookie header like:
# $headers["Cookie"] = "your_auth_cookie_here"

# Send the POST request
$response = Invoke-RestMethod -Uri $apiUrl -Method Post -Headers $headers -Body $body

# Output the response
$response
