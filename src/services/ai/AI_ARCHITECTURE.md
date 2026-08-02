# AI-First Invoice Management Architecture

## Overview
Transform the invoice management system into an AI-first application where natural language commands become the primary interface.

## Architecture Layers

```
┌─────────────────────────────────────────────┐
│   User (Natural Language Commands)          │
│   "Krijo faturë për Viktor 12 muaj"        │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│    AI Command Processor                     │
│  - Intent Detection                         │
│  - Entity Extraction                        │
│  - Validation                               │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│    Action Router                            │
│  - Structured Action JSON                   │
│  - Business Logic Validation                │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│    Action Handlers                          │
│  - InvoiceHandler                           │
│  - CustomerHandler                          │
│  - PaymentHandler                           │
│  - ExpenseHandler                           │
│  - ReportHandler                            │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│    Repository Layer                         │
│  - InvoiceRepository                        │
│  - CustomerRepository                       │
│  - PaymentRepository                        │
│  - ExpenseRepository                        │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│    Database (Supabase)                      │
│  - invoices, customers, payments, expenses │
└─────────────────────────────────────────────┘
```

## Supported Actions

### Invoice Operations
- `create_invoice` - Krijo faturë të re
- `edit_invoice` - Ndrysho faturë
- `delete_invoice` - Fshi faturë
- `list_invoices` - Shfaq faturat
- `get_invoice` - Hap faturën
- `void_invoice` - Anulo faturë
- `mark_paid` - Shëno si paguar

### Customer Operations
- `create_customer` - Krijo klient të ri
- `edit_customer` - Ndrysho të dhënat e klientit
- `delete_customer` - Fshi klient
- `list_customers` - Shfaq klientët
- `renew_customer` - Rinovo klientin

### Payment Operations
- `register_payment` - Regjistro pagese
- `delete_payment` - Fshi pagese
- `list_payments` - Shfaq pagesat

### Expense Operations
- `register_expense` - Regjistro shpenzim
- `list_expenses` - Shfaq shpenzimet
- `delete_expense` - Fshi shpenzim

### Reporting & Analytics
- `monthly_summary` - Përmbledhje mujore
- `profit_report` - Raport fitimi
- `partner_balance` - Bilanci i partnerit
- `income_report` - Raport të ardhurash
- `overdue_report` - Raporti i faturave të vonuara

### Organization Operations
- `switch_organization` - Ndërro organizatën
- `undo_last_action` - Anulo veprimin e fundit

## Intent Patterns (Albanian)

### Invoice Creation
- "Krijo faturë për [customer] [duration]"
- "Shto faturë [customer] [amount]"
- "Fatura e re për [customer]"

### Payment Registration
- "[Customer] pagoi"
- "Regjistro pagesë [customer] [amount]"
- "Marke si paguar [invoice_id]"

### Expense Registration
- "Shto shpenzim [amount] [category]"
- "Regjistro shpenzim [vendor] [amount]"

### Search & Filtering
- "Shfaq faturat e papaguara"
- "Kush pagoi këtë muaj"
- "Cilët klientë kanë borxh"
- "Lista e faturave për [customer]"

## Example Action Output

```json
{
  "intent": "create_invoice",
  "action": "create_invoice",
  "parameters": {
    "customer": "Viktor Shemshiri",
    "amount": 100,
    "package": "12 months",
    "date": "2026-08-02",
    "due": "2026-08-09",
    "status": "pending"
  },
  "confidence": 0.95,
  "missingFields": [],
  "followUpQuestion": null
}
```

## Validation Rules

### Required Fields by Action
- `create_invoice`: customer, amount, date
- `register_payment`: invoice_id, amount, mode
- `create_customer`: name, phone (optional)
- `register_expense`: amount, category/vendor

### Domain Validation
- Customer must exist (or create new)
- Amount must be > 0
- Dates must be valid format (YYYY-MM-DD)
- Invoice cannot be marked paid if already void
- Payment amount cannot exceed invoice amount

## Database Queries

All actions go through the Repository Layer:

```javascript
// InvoiceRepository
- getAll(orgId)
- getById(id)
- create(data)
- update(id, data)
- delete(id)
- getByCustomer(customer, orgId)
- getByStatus(status, orgId)
- getOverdue(orgId)
- getSummary(orgId, month, year)

// CustomerRepository
- getAll(orgId)
- getById(id)
- create(data)
- update(id, data)
- delete(id)
- findByName(name, orgId)
- getTotalBalance(customer, orgId)

// PaymentRepository
- getAll(orgId)
- getByInvoice(invoiceId)
- create(data)
- delete(id)
- getSummary(orgId, month, year)

// ExpenseRepository
- getAll(orgId)
- create(data)
- delete(id)
- getByCategory(category, orgId)
- getSummary(orgId, month, year)
```

## Response Format

All operations return:

```json
{
  "success": true,
  "data": { /* result data */ },
  "message": "Fatura u krijua me sukses",
  "action": "create_invoice",
  "timestamp": "2026-08-02T10:30:00Z",
  "error": null
}
```

## Error Handling

```javascript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Klient i panjohur: Viktor Shemshiri",
    "field": "customer",
    "suggestion": "Dëshiron të krijohet klient i ri?"
  }
}
```

## Flow Example: "Krijo faturë për Viktor 12 muaj"

1. **User Input**
   ```
   "Krijo faturë për Viktor 12 muaj"
   ```

2. **Intent Detection**
   ```
   Intent: CREATE_INVOICE
   Confidence: 0.98
   ```

3. **Entity Extraction**
   ```
   customer: "Viktor"
   duration: "12 muaj"
   package: "12 months"
   price: 100 (from mockItems)
   ```

4. **Validation**
   ```
   ✓ Customer exists
   ✓ Package is valid
   ✓ Amount is valid
   ```

5. **Action Execution**
   ```
   {
     "id": "INV-001234",
     "customer": "Viktor Shemshiri",
     "amount": 100,
     "date": "2026-08-02",
     "status": "pending",
     ...
   }
   ```

6. **Response**
   ```
   "Fatura INV-001234 u krijua për Viktor Shemshiri - €100 (12 muaj)"
   ```

## Implementation Files

- `AICommandProcessor.js` - Main processor
- `IntentDetector.js` - Intent recognition
- `EntityExtractor.js` - Extract entities from text
- `ValidationEngine.js` - Validate actions
- `ActionRouter.js` - Route to handlers
- `handlers/` - Individual action handlers
- `repositories/` - Data access layer
- `AIChat.jsx` - UI component for AI interface

## Future Enhancements

- Context awareness (remember customer from previous command)
- Multi-step operations (conversation flow)
- Undo/Redo stack management
- Bulk operations ("Create 5 invoices for...")
- Scheduled actions ("Send reminder tomorrow")
- AI learning from user corrections
- Voice input support
