# OpsKings Development Interview

## Overview

Build a support analytics dashboard that fetches data from the provided PostgreSQL database, performs aggregations, and displays insights through charts and tables. This task evaluates your ability to work with SQL databases, perform data analysis, and create meaningful visualizations.

## Database Setup

Within the database folder in repository, you will find 2 files

- schema.sql
- seed.sql

Create free Supabase account, and use SQL scripts outlined above to setup your database and data

Data only contains information about clients, tickets, and ticket types.

Your task is, additionally, to create proper users schema that supports internal team members and client users

## Authentication & Authorization Requirements

### User Types

1. **Internal Team Members** - Company employees (support agents, managers, admins)
2. **Client Users** - External customers who submitted tickets

### Row Level Security (RLS) Requirements

Implement RLS policies that enforce the following access rules:

| Data | Internal Team Members | Client Users |
|------|----------------------|--------------|
| Tickets | View ALL tickets | View ONLY their own tickets |
| Ticket Messages | View ALL messages | View ONLY messages on their tickets |
| Ticket Feedback | View ALL feedback | View ONLY feedback on their tickets |
| Clients | View ALL clients | View ONLY their own client record |
| Payments | View ALL payments | View ONLY their own payments |
| Team Members | View ALL team members | View ALL team members (public info only) |
| Ticket Types | View ALL | View ALL |

**Key Points:**
- Client users should be completely isolated to their own data
- Internal team members have full read access to all data for analytics purposes
- Consider write permissions as well (e.g., clients can create tickets, team members can update ticket status)

## Technical Requirements

- NextJS
- Supabase Postgres SQL (deployed on coolify)
- Drizzle ORM
- Zero web sync engine
- E2E type-safety - avoid using any() if possible
- BetterAuth for Authentication of internal team members and clients
- Supabase Row Level Security Set Up (do this with drizzle RLS support, web search it when necesary)
- Git for sharing the solution

---

## Required Features

### 1. **Dashboard Overview Cards** (Basic Aggregation)

Display summary statistics cards showing:

- **Total Tickets**
- **Open Tickets**
- **Avg Resolution Time** (in hours, for resolved tickets)
- **Customer Satisfaction** (average rating from feedback)

**Requirements:**

- Filtering by (required logic):
    - Date (exact date, date range, date on or before, date on or after)
    - Team Member (is, is not, is any of, is none of)
    - Ticket Type (is, is not, is any of, is none of)
    - Priority (is, is not, is any of, is none of)

---

### 2. **Tickets Over Time Chart** (Time Series)

Create a **line or bar chart** showing ticket volume by month for 2025.

**Requirements:**

- X-axis: Months (Jan - Nov 2025)
- Y-axis: Number of tickets created
- Show both created and resolved tickets (2 lines/series)

**Requirements:**

- Filtering by (required logic):
    - Date (date range, date on or before, date on or after)
    - Team Member (is, is not, is any of, is none of)
    - Ticket Type (is, is not, is any of, is none of)
    - Priority (is, is not, is any of, is none of)

---

### 3. **Team Performance Table** (Complex Aggregation)

Create a **sortable table** showing performance metrics for each team member:

| Team Member | Tickets Assigned | Tickets Resolved | Avg Resolution Time | Avg Rating | Status |
| --- | --- | --- | --- | --- | --- |
| John Smith | 45 | 42 | 3.2 hrs | 4.5 | Active |

**Requirements:**

- Sortable by any column
- Filterable by any column
- Include ALL team members (even if they have 0 tickets)
- Calculate average resolution time per agent
- Show average customer rating (from feedback)
- Highlight top performers (optional)

---

### 4. **Ticket Distribution Charts** (Category Analysis)

Create **2 visualizations**:

### a) Tickets by Type (Pie or Donut Chart)

- Show distribution of tickets across different ticket types
- Display percentage and count

**Requirements:**

- Filtering by (required logic):
    - Date (exact date, date range, date on or before, date on or after)
    - Team Member (is, is not, is any of, is none of)

### b) Tickets by Priority (Bar Chart)

- Show how many tickets fall into each priority level (low, medium, high, urgent)
- Consider showing this split by status (open vs closed)

**Requirements:**

- Filtering by (required logic):
    - Date (exact date, date range, date on or before, date on or after)
    - Team Member (is, is not, is any of, is none of)

---

### 5. **Client Analysis View** (Advanced Query)

Create a **table or list view** showing client insights:

| Client Name | Plan Type | Total Tickets | Open Tickets | Total Spent | Last Ticket Date |
| --- | --- | --- | --- | --- | --- |
| TechStart | Pro | 12 | 2 | $3,588.00 | 2024-11-05 |

**Requirements:**

- Show top 20 clients by ticket volume
- Include payment totals (from payments table)
- Show last ticket creation date
- Make it searchable by client name
- Add pagination

**Note:** This view is only accessible to internal team members.

---

### 6. **Response Time Analysis** (Statistical Analysis)

Create a **box plot, histogram, or summary statistics view** showing:

- Resolution time distribution by ticket priority
- Identify tickets that exceeded expected resolution time
- Compare actual vs. avg_resolution_hours from ticket_types

**Display:**

- Statistical breakdown (min, max, median, average)
- Visual representation (chart)
- List of "overdue" tickets (took longer than expected)

**Requirements:**

- Filtering by (required logic):
    - Date (exact date, date range, date on or before, date on or after)
    - Team Member (is, is not, is any of, is none of)

---

### 7. **Client Portal** (Client User View)

Create a simplified view for client users that shows:

- Their own tickets (list with status, priority, created date)
- Ability to create new tickets
- Ability to view ticket details and messages
- Ability to leave feedback on resolved tickets

**Note:** Client users should NOT have access to:
- Dashboard analytics
- Team performance metrics
- Other clients' data
- Client analysis view

---

### 8. Bonus (Optional)

- Implement better-auth as authentication mechanism for the system
- Adjust RLS policies to work with better-auth authentication
- Implement role-based UI (show/hide features based on user type)

---

## Performance Considerations

⚠️ **Note:** The database contains ~40,000 tickets. Your solution must handle this volume efficiently.

### Expected Performance:

- Dashboard overview: < 500ms
- Filtered queries: < 1s
- Table pagination: < 300ms
- Charts: < 800ms

### You Should Consider:

- Database indexing strategy
- Query optimization techniques
- Pagination approach
- Caching layers
- Frontend performance

---

## Submission Requirements

1. **GitHub Repository** with:
    - Complete source code
    - README with setup instructions
    - Database schema and seed files (provided)
    - Any environment variables needed
2. **README should include:**
    - How to set up and run the project
    - Tech stack used
    - Any assumptions made
    - Future improvements you would make
    - Which indexes you added and why
    - **How you implemented RLS for multi-tenant access (client isolation vs team member full access)**
    - How did you handle RLS with Better Auth
    - Any materialized views or database optimizations
    - Performance testing results
    - How your solution would scale to 100k+ tickets

3. **Deployment & Presentation**
    - Deployed demo link
    - Screenshots of the dashboard
    - Loom walkthrough

---

## EXTRA NOTES

- Remember ZERO cannot work with SSR in nextjs so read Zero react documentation on how to do this properly without SSR.