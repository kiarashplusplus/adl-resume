// Test stand-in for the Workers runtime module "cloudflare:email".
export class EmailMessage {
  constructor(public from: string, public to: string, public raw: string) {}
}
