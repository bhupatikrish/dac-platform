# SDK Quick Start

Get started with our platform SDK in your language of choice.

## Installation

=== "Python"

    ```python
    pip install platform-sdk
    ```

=== "JavaScript"

    ```javascript
    npm install @platform/sdk
    ```

=== "Go"

    ```go
    go get github.com/platform/sdk-go
    ```

## Hello World

=== "Python"

    ```python
    from platform_sdk import Client

    client = Client(api_key="your-key")
    response = client.ping()
    print(response.status)
    ```

=== "JavaScript"

    ```javascript
    import { Client } from '@platform/sdk';

    const client = new Client({ apiKey: 'your-key' });
    const response = await client.ping();
    console.log(response.status);
    ```

=== "Go"

    ```go
    package main

    import (
        "fmt"
        sdk "github.com/platform/sdk-go"
    )

    func main() {
        client := sdk.NewClient("your-key")
        resp, _ := client.Ping()
        fmt.Println(resp.Status)
    }
    ```

## Deployment Options

=== "Ordered Steps"

    1. Clone the repository
    2. Configure environment variables
    3. Run the deploy script
    4. Verify health-check endpoint

=== "Checklist"

    - Repository access granted
    - API keys provisioned
    - DNS records configured
    - Monitoring dashboards created
