# Admin Panel

Access at: `https://novally.tech/admin`

Requires user with `role = "admin"` in the database.

## Sections

### Dashboard (`/admin`)
Overview stats: total users, services, orders, revenue.

### Users (`/admin/users`)
- List all users
- Ban / unban with reason
- Change role (user ↔ admin)
- Impersonate user session

### Services (`/admin/services`)
- List all active services (deleted ones are hidden)
- **Suspend** — suspends on Pelican + marks DB `SUSPENDED`
- **Unsuspend** — unsuspends on Pelican + marks DB `ACTIVE`
- **Cancel** — suspends on Pelican + marks DB `CANCELLED`
- **Delete** — deletes from Pelican + hard-deletes from DB (irreversible)

### Plans (`/admin/plans`)
- Create, edit, delete plans
- Price entered in **dollars** (converted to cents automatically)
- Link Stripe Price IDs for subscription billing
- Set Pelican egg ID per plan (or leave blank for auto-detect)

### Orders (`/admin/billing`)
- View all orders and their status
- Filter by status

### Nodes (`/admin/nodes`)
- View Pelican nodes and their capacity
- Add/edit nodes

### Eggs (`/admin/eggs`)
- View available Pelican eggs
- Used to configure which egg each plan uses

### Provisioning (`/admin/provisioning`)
- View provisioning logs
- Retry failed provisioning

### Tickets (`/admin/tickets`)
- View and respond to support tickets
- Change ticket status and priority

### Settings (`/admin/settings`)
- App configuration

## Making a User Admin

Via psql on the server:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

Or via admin panel: Users → find user → Edit → set role to `admin`.
