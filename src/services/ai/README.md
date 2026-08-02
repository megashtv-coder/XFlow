# AI-First Invoice Management System

Transformimi i sistemit të menaxhimit të faturave në një aplikacion AI-first ku komadat në gjuhën natyrore shqipe bëhen ndërfaqja parësore.

## Architecture Overview

```
User Input (Albanian) → Intent Detection → Entity Extraction → Validation → Action Generation → Execution
```

## Komponente Kryesore

### 1. **IntentDetector.js**
Identifikon qëllimin e komandës përdoruesit duke përdorur pattern matching.

**Funksionet kryesore:**
- `detectIntent(text)` - Identifikon intent-in
- `getIntentLabel(intent)` - Merr etiketa shqiptare
- `getIntentExamples(intent)` - Merr shembuj komandash

**Shembull:**
```javascript
import { detectIntent } from './IntentDetector'

const result = detectIntent("Krijo faturë për Viktor 12 muaj")
// {
//   intent: 'CREATE_INVOICE',
//   confidence: 0.98,
//   matches: [...]
// }
```

### 2. **EntityExtractor.js**
Nxjerr entitetet relevante nga teksti i përdoruesit.

**Entitete të nxjerra:**
- `customer` - Emri i klientit
- `amount` - Shuma në euro
- `package` - Paketa/kohëzgjatja (1, 3, 6, 12 muaj)
- `date` - Data (YYYY-MM-DD)
- `category` - Kategoria e shpenzimit
- `vendor` - Furnitori
- `paymentMode` - Modaliteti i pagesës
- `invoiceId` - ID i faturës

**Shembull:**
```javascript
import { extractEntities } from './EntityExtractor'

const entities = extractEntities("Krijo faturë për Viktor 12 muaj", context)
// {
//   customer: "Viktor",
//   package: { duration: "12 months", months: 12 },
//   amount: 100
// }
```

### 3. **ValidationEngine.js**
Validon nëse kemi të gjithë të dhënat e nevojshme për veprim.

**Funksionet kryesore:**
- `validateAction(intent, entities, context)` - Validon veprimin
- `suggestCustomer(input, customers)` - Sugjeron klient
- `autoCorrect(text)` - Korrigjon gabime drejtshkrimi

**Shembull:**
```javascript
import { validateAction } from './ValidationEngine'

const validation = validateAction('CREATE_INVOICE', entities, context)
// {
//   valid: false,
//   missingFields: ['amount'],
//   followUpQuestion: 'Sa është shuma?'
// }
```

### 4. **AICommandProcessor.js**
Orkestrator kryesor që bashkon të gjitha komponentet.

**Metoda kryesore:**
- `processCommand(userInput)` - Proceson komandën
- `continueConversation(response, previousResult)` - Vazhdon bisedën
- `getHistory(limit)` - Merr historikun e komandave

**Shembull:**
```javascript
import { createAICommandProcessor } from './AICommandProcessor'

const processor = createAICommandProcessor(appContext)
const result = await processor.processCommand("Krijo faturë për Viktor 12 muaj")
// {
//   success: true,
//   intent: 'CREATE_INVOICE',
//   action: { ... },
//   entities: { ... }
// }
```

### 5. **ActionRouter.js**
Gjeneron strukturat e veprimeve (actions) në formatin JSON.

**Formati i veprimeve:**
```json
{
  "action": "create_invoice",
  "type": "INVOICE",
  "operation": "CREATE",
  "parameters": {
    "customer": "Viktor Shemshiri",
    "amount": 100,
    "date": "2026-08-02",
    "due": "2026-08-09",
    "status": "pending"
  }
}
```

### 6. **AIChat.jsx**
React komponenti për ndërfaqjen e chat-it.

## Integration në Aplikacion

### 1. **Shto në Sidebar**

```jsx
import AIChat from './components/AIChat'

export default function Sidebar() {
  return (
    <div>
      {/* Existing sidebar items */}
      <button onClick={() => navigate('ai-chat')}>
        🤖 AI Asistenti
      </button>
    </div>
  )
}
```

### 2. **Shto rota në router**

```jsx
const routes = {
  'ai-chat': <AIChat />,
  // ... other routes
}
```

### 3. **Përdor në komponente**

```jsx
import { createAICommandProcessor } from './services/ai/AICommandProcessor'
import { useApp } from './context/AppContext'

export function MyComponent() {
  const appContext = useApp()
  const processor = createAICommandProcessor(appContext)

  const handleCommand = async (command) => {
    const result = await processor.processCommand(command)
    if (result.success) {
      // Execute result.action
      executeAction(result.action)
    }
  }

  return (
    <div>
      {/* Your component */}
    </div>
  )
}
```

## Komanda Të Mbështetura

### Fatura
```
Krijo faturë për [customer] [duration]
Ndrysho faturë INV-001
Fshi faturë INV-001
Shfaq faturat e papaguara
Shëno INV-001 si paguar
Mbylle faturën INV-001
```

### Klientët
```
Krijo klient të ri [name]
Ndrysho klient [name]
Fshi klient [name]
Shfaq klientët
Rinovo klient [name]
```

### Pagesat
```
[Customer] pagoi [amount]
Regjistro pagesë [amount] për INV-001
Fshi pagesën e INV-001
Shfaq pagesat
```

### Shpenzimet
```
Shto shpenzim [amount] [category]
Regjistro shpenzim [vendor] [amount]
Fshi shpenzim
Shfaq shpenzimet
```

### Raportet
```
Sa fitim kam këtë muaj?
Përmbledhje mujore
Bilanci i partnerit [name]
Cilat janë faturat e vonuara?
Shfaq të ardhurat këtë muaj
```

## Format i Përgjigjes

```javascript
{
  success: true/false,
  intent: 'CREATE_INVOICE',
  intentLabel: 'Krijo Faturë',
  action: {
    action: 'create_invoice',
    type: 'INVOICE',
    parameters: { ... }
  },
  entities: { ... },
  validation: { ... },
  error: null,
  confidence: 0.95,
  timestamp: '2026-08-02T10:30:00Z'
}
```

## Shfaq Fluksin e Bisetës

1. **Përdorues**: "Krijo faturë për Viktor"
   
2. **Sistemi**: Detekton intent → Nxjerr entities → Validon
   - Entitete: `{ customer: "Viktor" }`
   - Fushat që mungojnë: `["amount"]`
   
3. **Sistemi**: "Sa është shuma?"

4. **Përdorues**: "100"
   
5. **Sistemi**: Validon ndaj → Gjeneron action
   ```json
   {
     "action": "create_invoice",
     "parameters": {
       "customer": "Viktor",
       "amount": 100,
       "date": "2026-08-02",
       ...
     }
   }
   ```

6. **Përdorues**: "✓ Pranohe" ose "✗ Anulo"

7. **Sistemi**: Ekzekuton veprimin

## Zgjerimi i Sistemit

### Shto Intent të Ri

1. **IntentDetector.js** - Shto pattern:
```javascript
MY_NEW_INTENT: [
  /pattern1/i,
  /pattern2/i,
]
```

2. **EntityExtractor.js** - Shtoni extraction logic

3. **ValidationEngine.js** - Shtoni validation rules

4. **ActionRouter.js** - Shtoni action generator:
```javascript
function generateMyNewAction(entities, context) {
  return {
    action: 'my_new_action',
    parameters: { ... }
  }
}
```

### Shto Handler të Ri

Krijoni `handlers/MyActionHandler.js`:
```javascript
export class MyActionHandler {
  async execute(action, context) {
    // Implement your logic
    return { success: true, data: ... }
  }
}
```

## Testing

```javascript
import { AICommandProcessor } from './services/ai/AICommandProcessor'

const processor = new AICommandProcessor({
  customers: [ { name: "Viktor", phone: "..." } ],
  invoices: [],
  items: [],
  // ... other context
})

// Test command
const result = await processor.processCommand("Krijo faturë për Viktor 12 muaj")
console.assert(result.success === true)
console.assert(result.action.action === 'create_invoice')
```

## Performance

- **Intent Detection**: < 5ms
- **Entity Extraction**: < 10ms
- **Validation**: < 5ms
- **Action Generation**: < 2ms
- **Total**: < 25ms

## Siguria

- Të gjitha input-at validohen
- SQL injection prevention (përdorim Supabase)
- XSS prevention (React escaping)
- Rate limiting (për të ardhmen)
- User permissions checking

## Të Ardhurat

- [ ] Context-aware commands (rikujtim customer-it)
- [ ] Multi-step operations
- [ ] Voice input support
- [ ] Scheduled operations
- [ ] Bulk operations
- [ ] AI learning from corrections
- [ ] Custom command aliases
- [ ] Templates
