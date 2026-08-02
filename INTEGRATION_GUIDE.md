# AI-First Integration Guide

Udhëzim i plotë për integrimin e arkitekturës AI-first në aplikacionin ekzistues.

## 📋 Hapat e Integrimit

### Step 1: Shto Strukturën e Direktorigut

```bash
src/services/ai/
├── AI_ARCHITECTURE.md          # Dokumentacioni i arkitekturës
├── IntentDetector.js           # Detektori i qëllimit
├── EntityExtractor.js          # Ekstraktori i entiteteve
├── ValidationEngine.js         # Motori i validimit
├── AICommandProcessor.js       # Procesor kryesor
├── ActionRouter.js             # Gjeneruesi i veprimeve
├── examples.js                 # Shembuj praktikë
└── README.md                   # Dokumentacioni
```

### Step 2: Shto React Komponentin

Integro `AIChat.jsx` në aplikacion:

```bash
src/components/AIChat.jsx
```

### Step 3: Shto në Routing

Ndrysho `App.jsx` ose router-in tuaj:

```jsx
import AIChat from './components/AIChat'

const routes = {
  'dashboard': <Dashboard />,
  'invoices': <Invoices />,
  'ai-chat': <AIChat />,           // ← Shto këtë
  // ... existing routes
}
```

### Step 4: Shto në Sidebar

Ndrysho `Sidebar.jsx`:

```jsx
<button 
  onClick={() => navigate('ai-chat')}
  className="flex items-center gap-2 px-4 py-2"
>
  🤖 AI Asistenti
</button>
```

### Step 5: Implemento Action Handlers

Krijo `handlers/` folder në `src/services/ai/`:

```javascript
// src/services/ai/handlers/InvoiceHandler.js
export class InvoiceHandler {
  constructor(repository) {
    this.repository = repository
  }

  async createInvoice(params) {
    // Implement invoice creation logic
    return this.repository.createInvoice(params)
  }

  async editInvoice(invoiceId, updates) {
    // Implement invoice editing logic
    return this.repository.updateInvoice(invoiceId, updates)
  }

  // ... more methods
}
```

### Step 6: Konekto Action Handlers me AIChat

Ndrysho `AIChat.jsx` për të ekzekutuar veprimet:

```jsx
const handleAcceptAction = async () => {
  if (!currentResult?.action) return

  try {
    const handler = getHandlerForAction(currentResult.action.type)
    const result = await handler.execute(currentResult.action)
    
    if (result.success) {
      showToast('✓ Veprim u ekzekutua', 'success')
      // Refresh data if needed
      appContext.refreshInvoices()
    } else {
      showToast('❌ Gabim: ' + result.error, 'error')
    }
  } catch (err) {
    showToast('Gabim në ekzekutim', 'error')
  }
}
```

## 🎯 Komanda të Mbështetura nga Fillim

Këto komanda janë të gatshme për përdorim menjëherë:

### Fatura
```
✅ Krijo faturë për [customer] [duration]
✅ Ndrysho faturë [invoice_id]
✅ Fshi faturë [invoice_id]
✅ Shfaq faturat e papaguara
✅ Shëno [invoice_id] si paguar
✅ Mbylle faturën [invoice_id]
```

### Pagesat
```
✅ [Customer] pagoi [amount]
✅ Regjistro pagesë [amount]
✅ Fshi pagesën
✅ Shfaq pagesat këtë muaj
```

### Shpenzimet
```
✅ Shto shpenzim [amount] [category]
✅ Regjistro shpenzim [vendor] [amount]
✅ Shfaq shpenzimet
```

### Raportet
```
✅ Sa fitim kam këtë muaj?
✅ Përmbledhje mujore
✅ Cilat janë faturat e vonuara?
✅ Shfaq të ardhurat këtë muaj
```

## 📝 Implementimi i Action Handler-ave

### Shembull 1: Invoice Handler

```javascript
// src/services/ai/handlers/InvoiceHandler.js

import { supabase } from '../lib/supabase'

export class InvoiceHandler {
  constructor(appContext) {
    this.appContext = appContext
  }

  async execute(action) {
    try {
      switch (action.action) {
        case 'create_invoice':
          return await this.createInvoice(action.parameters)
        case 'edit_invoice':
          return await this.editInvoice(action.parameters)
        case 'delete_invoice':
          return await this.deleteInvoice(action.parameters)
        case 'mark_paid':
          return await this.markPaid(action.parameters)
        default:
          throw new Error(`Unknown invoice action: ${action.action}`)
      }
    } catch (err) {
      return {
        success: false,
        error: err.message,
      }
    }
  }

  async createInvoice(params) {
    const invoice = {
      id: `INV-${Date.now()}`,
      customer: params.customer,
      amount: params.amount,
      date: params.date,
      due: params.due,
      status: params.status,
      items: params.items || [],
      orgId: this.appContext.currentOrgId,
    }

    // Insert in Supabase
    const { data, error } = await supabase
      .from('invoices')
      .insert([invoice])

    if (error) throw error

    // Update local state
    this.appContext.setInvoices(prev => [...prev, invoice])

    return {
      success: true,
      data: invoice,
      message: `Fatura ${invoice.id} u krijua për ${params.customer}`,
    }
  }

  async editInvoice(params) {
    const { invoiceId, updates } = params

    // Update in Supabase
    const { error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', invoiceId)

    if (error) throw error

    // Update local state
    this.appContext.setInvoices(prev =>
      prev.map(inv =>
        inv.id === invoiceId ? { ...inv, ...updates } : inv
      )
    )

    return {
      success: true,
      message: `Fatura ${invoiceId} u përditësua`,
    }
  }

  async markPaid(params) {
    const { invoiceId, status, payment } = params

    // Create payment record if provided
    if (payment) {
      const paymentRecord = {
        id: `PAY-${Date.now()}`,
        invoiceId,
        amount: payment.amount,
        mode: payment.mode,
        date: payment.date,
        orgId: this.appContext.currentOrgId,
      }

      const { error } = await supabase
        .from('payments')
        .insert([paymentRecord])

      if (error) throw error

      this.appContext.setPayments(prev => [...prev, paymentRecord])
    }

    // Update invoice status
    const { error } = await supabase
      .from('invoices')
      .update({ status })
      .eq('id', invoiceId)

    if (error) throw error

    this.appContext.setInvoices(prev =>
      prev.map(inv =>
        inv.id === invoiceId ? { ...inv, status } : inv
      )
    )

    return {
      success: true,
      message: `Fatura ${invoiceId} u shënua si ${status}`,
    }
  }
}
```

### Shembull 2: Payment Handler

```javascript
// src/services/ai/handlers/PaymentHandler.js

export class PaymentHandler {
  constructor(appContext) {
    this.appContext = appContext
  }

  async execute(action) {
    switch (action.action) {
      case 'register_payment':
        return await this.registerPayment(action.parameters)
      case 'delete_payment':
        return await this.deletePayment(action.parameters)
      case 'list_payments':
        return await this.listPayments(action.parameters)
      default:
        throw new Error(`Unknown payment action: ${action.action}`)
    }
  }

  async registerPayment(params) {
    const payment = {
      id: `PAY-${Date.now()}`,
      invoiceId: params.invoiceId,
      amount: params.amount,
      mode: params.mode,
      date: params.date,
      orgId: this.appContext.currentOrgId,
    }

    // Insert payment
    // Update invoice status
    // Return result

    return {
      success: true,
      data: payment,
      message: `Pagesa €${params.amount} u regjistru për ${params.invoiceId}`,
    }
  }
}
```

## 🧪 Testing

### Unit Test Shembull

```javascript
// src/services/ai/AICommandProcessor.test.js

import { createAICommandProcessor } from './AICommandProcessor'

describe('AICommandProcessor', () => {
  let processor

  beforeEach(() => {
    processor = createAICommandProcessor({
      customers: [
        { name: 'Viktor Shemshiri', phone: '...' }
      ],
      invoices: [],
      items: [
        { name: '12 muaj abonim', salePrice: 100 }
      ],
    })
  })

  test('should detect create_invoice intent', async () => {
    const result = await processor.processCommand(
      'Krijo faturë për Viktor 12 muaj'
    )

    expect(result.success).toBe(true)
    expect(result.intent).toBe('CREATE_INVOICE')
    expect(result.action.action).toBe('create_invoice')
  })

  test('should ask for missing fields', async () => {
    const result = await processor.processCommand(
      'Krijo faturë për Viktor'
    )

    expect(result.success).toBe(false)
    expect(result.error.followUpQuestion).toBe('Sa është shuma?')
  })
})
```

## 🔗 Integration Checklist

- [ ] Krijo `src/services/ai/` folder
- [ ] Kopjo të gjithë AI service files
- [ ] Shto `AIChat.jsx` komponentën
- [ ] Përditëso router
- [ ] Përditëso sidebar
- [ ] Krijo action handlers
- [ ] Integro handlers me AIChat
- [ ] Test të gjitha komandat
- [ ] Shto error handling
- [ ] Dokumento custom commands
- [ ] Deploy

## 🚀 Deployment

### Environment Variables

```
VITE_AI_ENABLED=true
VITE_AI_MAX_HISTORY=50
VITE_AI_TIMEOUT=30000
```

### Build

```bash
npm run build
```

## 📊 Monitoring

Shtoni logging për të ndjekur përdorimin e AI:

```javascript
// Log successful commands
console.log(`[AI] ${result.intent}: ${result.action.action}`)

// Log errors
if (!result.success) {
  console.error(`[AI Error] ${result.error.code}: ${result.error.message}`)
}
```

## 🤝 Support

### Debugging

```javascript
// Enable verbose logging
const processor = createAICommandProcessor(appContext)
processor.DEBUG = true

// Get history
const history = processor.getHistory(10)
console.log(history)
```

### Common Issues

1. **Klient nuk gjendet**
   - Siguro që emri përpunohet saktë
   - Kontrolloj spelling-un

2. **Fatura nuk gjendet**
   - Kontrolloj se ID-ja ekziston
   - Kontrolloj organizatën aktuale

3. **Suma e pavlefshme**
   - Duhet të jetë numër pozitiv
   - Kontrolloj decimalet

## 📚 Resources

- [AI Architecture](./src/services/ai/AI_ARCHITECTURE.md)
- [API Documentation](./src/services/ai/README.md)
- [Examples](./src/services/ai/examples.js)

---

**Versioni**: 1.0.0  
**Përditësuar**: 2026-08-02  
**Përgjegjës**: AI Development Team
