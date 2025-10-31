# Manual payment transaction recovery guide

This document records the process we used to recover a failed manual payment transaction that originally triggered the PostgreSQL error `22P02: invalid input syntax for type uuid`. The goal is to provide an operator-friendly checklist for cleaning the payload before inserting it back into the database through the `manual_payment_transaction` REST endpoint.

## Root cause summary

The `22P02` error occurred because several identifier fields (`tenant_id`, `user_id`, and `evento_id`) contained malformed UUID strings when the payload was resent. PostgreSQL validates UUID syntax on insert and rejects any value that does not match the canonical 8-4-4-4-12 hexadecimal format.

## Clean-up checklist

Before attempting the insert again, confirm every item in this list:

1. **IDs are normalized** – All UUID fields (`tenant_id`, `user_id`, `evento_id`, `payment_gateway_id`, etc.) must be lowercase, hyphenated, 36-character strings.
2. **Numeric values use dots** – Monetary values such as `amount`, seat prices, and payment amounts should use `.` as the decimal separator (e.g. `25.00`).
3. **Nullables are explicit** – Optional gateway fields (`gateway_id`, `gateway_transaction_id`, `gateway_response`, `processed_by`) should be set to `null` if no value is available.
4. **Status fields are consistent** – `status` and any nested payment status should match the intended final state (`completed`, `pending`, etc.).
5. **Nested arrays align with totals** – Ensure `seats` and `payments` subtotals add up to the main `amount`.
6. **Timestamp is ISO-8601** – `fecha` must be in UTC ISO format (`YYYY-MM-DDTHH:MM:SS.sssZ`).

## Minimal cleaned payload example

Use the following payload as a template and adjust the field values to match the transaction you are restoring. This block can be copied directly into a file (for example `payload.json`). Place it before the cURL example below for quick reference.

```json
{
  "order_id": "ZHGIBMER",
  "gateway_id": null,
  "payment_gateway_id": null,
  "amount": 25.0,
  "currency": "USD",
  "status": "completed",
  "gateway_transaction_id": null,
  "gateway_response": null,
  "locator": "ZHGIBMER",
  "tenant_id": "9dbdb86f-8424-484c-bb76-0d9fa27573c8",
  "user_id": "cf142159-506f-4fe6-a45c-98ca2fd07f20",
  "evento_id": "b0b48dd8-7c52-462a-8c79-b00129422810",
  "funcion_id": 43,
  "payment_method": "efectivo",
  "gateway_name": "Efectivo",
  "seats": [
    {
      "id": "silla_1760365774051_18",
      "name": "Silla 18",
      "price": 25.0,
      "zona": "General"
    }
  ],
  "payments": [
    {
      "method": "efectivo",
      "amount": 25.0,
      "reference": "ZHGIBMER",
      "status": "completed"
    }
  ],
  "fecha": "2024-11-18T20:04:31.000Z",
  "processed_by": null,
  "metadata": {
    "source": "manual-recovery"
  }
}
```

## REST insert example

```bash
curl -X POST   "https://<PROJECT>.supabase.co/rest/v1/manual_payment_transaction"   -H "apikey: $SERVICE_ROLE_KEY"   -H "Authorization: Bearer $SERVICE_ROLE_KEY"   -H "Content-Type: application/json"   -d @payload.json
```

## Optional: batch UUID validation helper

To verify that every UUID in your payload respects the required format before inserting, run the following query in the SQL editor (replace the sample literals with the values you plan to use):

```sql
select
  'tenant_id' as name,
  '9dbdb86f-8424-484c-bb76-0d9fa27573c8' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' as is_valid
union all
select
  'user_id',
  'cf142159-506f-4fe6-a45c-98ca2fd07f20' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
union all
select
  'evento_id',
  'b0b48dd8-7c52-462a-8c79-b00129422810' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
```

Any `false` result indicates that the corresponding value must be corrected before attempting the insert.

## Troubleshooting tips

- If the REST call still fails with `22P02`, double-check for stray whitespace or hidden characters in UUID fields.
- For monetary mismatches, compare the `payments.amount` total against `amount` and adjust rounding.
- Prefer copying raw UUID values directly from Supabase Studio or the database to avoid transcription errors.
