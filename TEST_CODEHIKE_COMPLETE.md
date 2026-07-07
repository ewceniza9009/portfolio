# CodeHike Block Test Suite

## Basic Syntax Highlighting

### TEST BASIC - Plain

```codehike
const greeting = "Hello, Code Hike!";
console.log(greeting);
```

### TEST BASIC - With Language Hint

```codehike javascript
function fibonacci(n: number): number {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}

console.log(fibonacci(10))
```

## Line Annotations - Border

### TEST BORDER - Range (1:3) - NOT WORKING, IT IS NOT A LINE BORDER

```codehike
function greet(name: string) {
  // !border(1:3)
  const greeting = `Hello, ${name}!`
  console.log(greeting)
  return greeting
}

greet("World")
```

### TEST BORDER - Relative (+3) - NOT WORKING, IT HIGHLITES 5 LINES from the center of all the code snippet

```codehike
function borderRangeExamples() {
  // !border(+3)
  const line1 = "This line"
  const line2 = "This line too"
  const line3 = "And this line"
  console.log("Not bordered")
}
```

### TEST BORDER - Start/End Pair - NOT WORKING, it is not a border it is a highlight

```codehike
function borderStartEnd() {
  // !border(start)
  const a = 1
  const b = 2
  const c = 3
  // !border(end)
  const d = 4
}
```

### TEST BORDER - Simple (no range, applies to next line) - NOT WORKING, ALL THE BORDERS ARE UNABLE TO WORK, IT HIGLIGHTS NOT DRAWING A SQUIRE WITH BORDERS

```codehike
function borderSimple() {
  // !border
  const x = 1
  const y = 2
}
```

## Line Annotations - Focus - WORKING

### TEST FOCUS - Multiple Lines

```codehike
function calculateTotal(items: number[]) {
  let total = 0
  // !focus
  for (const item of items) {
    total += item
  }
  // !focus
  return total
}

console.log(calculateTotal([1, 2, 3, 4, 5]))
```

## Line Annotations - Background - I DONT KNOW WHAT IT DOES, I LOOKS NOT SIMPLE NO BACKGROUND AT ALL IF IT IS A BACGROUND

### TEST BG - Multiple Colors

```codehike
function processData(data: string[]) {
  // !bg(red)
  const filtered = data.filter(item => item.length > 3)
  // !bg(green)
  const mapped = filtered.map(item => item.toUpperCase())
  return mapped
}

console.log(processData(["hi", "hello", "hey", "world"]))
```

## Line Annotations - Mark - NOT WRKING, I SEE NO DECORATIONS AT ALL

### TEST MARK - Whole Line

```codehike
const config = {
  // !mark
  apiUrl: "https://api.example.com",
  timeout: 5000,
  retries: 3
}
```

### TEST MARK - Column Range [10:30] - NOT WRKING, I SEE NO DECORATIONS AT ALL

```codehike
const api = {
  // !mark[10:30]
  endpoint: "https://api.example.com/v1/users",
  timeout: 5000
}
```

## Line Annotations - Highlight (Regex)

### TEST HIGHLIGHT - Regex Pattern - WORKING

```codehike
const patterns = {
  // !highlight/\.toUpperCase\(\)/g
  transform: (str: string) => str.toUpperCase(),
  // !highlight/\.toLowerCase\(\)/g
  normalize: (str: string) => str.toLowerCase()
}
```

### TEST HIGHLIGHT - Function Calls - NOT WORKINGS THE COMMENT ANNOTATION IS SHOWING

```codehike
function regexHighlight() {
  const user = getUser() // !highlight/getUser\(\)/g
  const data = fetchData() // !highlight/fetchData\(\)/g
}
```

## Line Annotations - Diff

### TEST DIFF - Add/Remove - NOT WORKING oldValue and new values are red return is green, wrong implementation

```codehike
function oldFunction() {
  // !diff(-)
  const oldValue = 42
  // !diff(+)
  const newValue = 43
  return newValue
}
```

### TEST DIFF - Diff Language

```codehike diff
- // !diff(-)
- const oldCode = "removed";
+ // !diff(+)
+diff(+)
+ const newCode = "added";
```

## Line Annotations - Fold/Collapse

### TEST FOLD - Fold/End - WRONG IMPLEMENTATION IT ONLY FOLDS console.log("This section can be folded")

```codehike
function longFunction() {
  // !fold
  console.log("This section can be folded")
  console.log("Line 2")
  console.log("Line 3")
  // !fold(end)
  console.log("This is always visible")
}
```

### TEST FOLD - Start/End - WORKING

```codehike
function anotherFoldExample() {
  // !fold(start)
  console.log("Folded section starts here")
  console.log("More folded content")
  // !fold(end)
  console.log("Not folded")
}
```

### TEST COLLAPSE - Collapse/End - NOT WORKING only the firstline folds

```codehike
function collapseExample() {
  // !collapse
  console.log("This can be collapsed")
  console.log("Line 2")
  console.log("Line 3")
  // !collapse(end)
  console.log("Always visible")
}
```

## Line Annotations - ClassName

### TEST CLASSNAME - Whole Line - not working, maybe cannot find the css

```codehike
// !classname(custom-highlight)
function specialFunction() {
  return "special"
}
```

## Inline Annotations - Callout

### TEST CALLOUT - Line Level - NOT WORKING DUDE

```codehike
function fetchData(url: string) {
  // !callout(This fetches data from the API endpoint)
  return fetch(url).then(res => res.json())
}
```

### TEST CALLOUT - Inline with Column Range

```codehike
function inlineCallout() {
  const x = 10 // !callout[5:7](This highlights "10")
}
```

## Inline Annotations - Tooltip

### TEST TOOLTIP - Inline Column Range

```codehike
const config = {
  // !tooltip[10:25](This is the API base URL)
  baseUrl: "https://api.example.com/v1"
}
```

### TEST TOOLTIP - Function Parameter

```codehike
function inlineTooltip() {
  const url = "https://api.example.com" // !tooltip[10:30](Base API URL)
}
```

## Inline Annotations - Link

### TEST LINK - Line Level

```codehike
// !link(https://github.com/example/repo)
const repo = "https://github.com/example/repo"
```

### TEST LINK - Inline

```codehike
function inlineLink() {
  const repo = "https://github.com/user/repo" // !link(https://github.com/user/repo)
}
```

## Inline Annotations - Footnote

### TEST FOOTNOTE - Line Level

```codehike
function calculate() {
  const result = 2 + 2 // !footnote(This is a footnote explaining the calculation)
  return result
}
```

### TEST FOOTNOTE - Inline

```codehike
function inlineFootnote() {
  const value = 42 // !footnote(The answer to everything)
}
```

## Inline Annotations - Label

### TEST LABEL - Line Level

```codehike
const status = "pending" // !label(This is a status label)
```

### TEST LABEL - Inline

```codehike
function inlineLabel() {
  const mode = "production" // !label(Environment)
}
```

## Inline Annotations - Style

### TEST STYLE - Inline CSS

```codehike
const important = "Do not delete!" // !style(color: red; font-weight: bold)
```

### TEST STYLE - Complex Style

```codehike
function inlineStyle() {
  const warning = "Danger!" // !style(color: red; background: yellow; font-weight: bold)
}
```

## Inline Annotations - ClassName

### TEST CLASSNAME INLINE - Column Range

```codehike
function inlineClassname() {
  const special = "highlighted" // !classname[10:20](custom-class)
}
```

## Meta Flags

### TEST WRAP - Line Wrapping

```codehike wrap
function veryLongFunctionNameThatExceedsTheViewportWidthAndNeedsWrappingToBeVisible(parameterOne: string, parameterTwo: number, parameterThree: boolean): string {
  return `${parameterOne}-${parameterTwo}-${parameterThree}`
}
```

### TEST SLIDESHOW - Basic

```codehike slideshow
// Slide 1
console.log("Slide 1: Introduction")

// ---
// Slide 2
console.log("Slide 2: Main Content")

// ---
// Slide 3
console.log("Slide 3: Conclusion")
```

### TEST SLIDESHOW WRAP - Combined

```codehike slideshow wrap
// Slide 1 with wrapping
function veryLongFunctionNameThatExceedsTheViewportWidthAndNeedsWrappingToBeVisible(parameterOne: string, parameterTwo: number, parameterThree: boolean): string {
  return `${parameterOne}-${parameterTwo}-${parameterThree}`
}

// ---
// Slide 2
console.log("Slide 2 content")

// ---
// Slide 3
console.log("Slide 3: End")
```

## Combined Annotations

### TEST COMBINED - Focus + Border + BG + Callout

```codehike javascript wrap
// !focus
function highlightThis() {
  // !border(red)
  const important = "This line has a red border"
  // !bg(yellow)
  const highlighted = "This line has yellow background"
  return { important, highlighted }
}
```

### TEST COMBINED - Complex Real World

```codehike typescript
function processUserData(users: User[]) {
  // !focus
  const activeUsers = users.filter(u => u.isActive)
  // !border(blue)
  const sortedUsers = activeUsers.sort((a, b) => b.score - a.score)
  // !bg(green)
  const topUsers = sortedUsers.slice(0, 10)

  // !callout(This returns the top 10 active users by score)
  return topUsers.map(u => ({
    id: u.id,
    name: u.name,
    score: u.score
  }))
}

interface User {
  id: string
  name: string
  score: number
  isActive: boolean
}
```

### TEST COMBINED - Multiple on Same Line

```codehike
function multipleAnnotations() {
  // !focus
  // !border(blue)
  const important = "Focused and bordered"
  // !bg(yellow)
  // !mark
  const alsoMarked = "Background and marked"
}
```

### TEST COMBINED - Complex Class Example

```codehike javascript
// Complex real-world example with multiple features
class UserService {
  // !focus
  constructor(private api: ApiClient) {}

  // !border(blue)
  async getUser(id: string): Promise<User> {
    // !callout(Fetches user from API with caching)
    const cached = this.cache.get(id)
    if (cached) return cached

    // !bg(yellow)
    const user = await this.api.get(`/users/${id}`)

    // !mark[20:35]
    this.cache.set(id, user)
    return user
  }

  // !fold
  async getUsers(filters: UserFilters): Promise<User[]> {
    // !highlight/fetch\(/g
    const response = await this.fetch('/users', filters)
    return response.data
  }
  // !fold(end)

  // !bg(red)
  async deleteUser(id: string): Promise<void> {
    // !tooltip[15:30](Permanently deletes user)
    await this.api.delete(`/users/${id}`)
    this.cache.delete(id)
  }
}

interface User {
  id: string
  name: string
  email: string
}

interface UserFilters {
  active?: boolean
  role?: string
}

interface ApiClient {
  get(url: string): Promise<any>
  delete(url: string): Promise<void>
}
```

## Edge Cases

### TEST LONG - Many Lines (26 lines)

```codehike
// Line 1
const a = 1
// Line 2
const b = 2
// Line 3
const c = 3
// Line 4
const d = 4
// Line 5
const e = 5
// Line 6
const f = 6
// Line 7
const g = 7
// Line 8
const h = 8
// Line 9
const i = 9
// Line 10
const j = 10
// Line 11
const k = 11
// Line 12
const l = 12
// Line 13
const m = 13
// Line 14
const n = 14
// Line 15
const o = 15
// Line 16
const p = 16
// Line 17
const q = 17
// Line 18
const r = 18
// Line 19
const s = 19
// Line 20
const t = 20
// Line 21
const u = 21
// Line 22
const v = 22
// Line 23
const w = 23
// Line 24
const x = 24
// Line 25
const y = 25
// Line 26
const z = 26
console.log('All variables declared')
```

### TEST EMPTY - Empty Block

```codehike

```

### TEST COMMENTS - Only Comments with Annotations

```codehike
// This is a comment
// Another comment
// !focus
// Focused comment
// !border
// Bordered comment
```

## Multi-Language Support

### TEST PYTHON - Python Syntax

```codehike python
def python_example():
    # !focus
    items = [1, 2, 3, 4, 5]
    # !border(1:3)
    result = sum(items)
    # !bg(green)
    return result

print(python_example())
```

### TEST RUST - Rust Syntax

```codehike rust
fn rust_example() {
    // !focus
    let mut vec = Vec::new();
    // !border(+3)
    vec.push(1);
    vec.push(2);
    vec.push(3);
    // !bg(red)
    println!("{:?}", vec);
}
```

### TEST GO - Go Syntax

```codehike go
func goExample() {
    // !focus
    items := []int{1, 2, 3}
    // !border(1:2)
    sum := 0
    for _, v := range items {
        sum += v
    }
    // !bg(green)
    return sum
}
```

### TEST CSS - CSS Syntax

```codehike css
.card {
  /* !focus */
  background: var(--surface);
  /* !border(1:3) */
  border: 1px solid var(--border);
  border-radius: 12px;
  /* !bg(yellow) */
  padding: 1.5rem;
}
```

### TEST HTML - HTML Syntax

```codehike html
<div class="container">
  <!-- !focus -->
  <header>Header</header>
  <!-- !border(1:2) -->
  <main>Main content</main>
  <!-- !bg(green) -->
  <footer>Footer</footer>
</div>
```

### TEST SQL - SQL Syntax

```codehike sql
SELECT
  -- !focus
  u.username,
  -- !border(1:2)
  COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
-- !bg(yellow)
GROUP BY u.username
```

### TEST JSON - JSON Syntax

```codehike json
{
  // !focus
  "name": "my-project",
  // !border(1:3)
  "version": "1.0.0",
  // !bg(green)
  "description": "A sample project"
}
```

### TEST YAML - YAML Syntax

```codehike yaml
services:
  # !focus
  app:
    # !border(1:4)
    build: .
    ports:
      - "3000:3000"
    # !bg(yellow)
    environment:
      - NODE_ENV=production
```

### TEST MARKDOWN - Markdown Syntax

```codehike markdown
# Heading

<!-- !focus -->
Some **bold** text.

<!-- !border(1:2) -->
- List item 1
- List item 2

<!-- !bg(yellow) -->
> Blockquote
```
