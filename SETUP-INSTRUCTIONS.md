# Supplier Orders Table Setup Instructions

## 🎯 Objective
Create the `supplier_orders` table in your Supabase database to enable out-of-stock order requests and supplier management.

## 📋 Current Status
- ✅ Supabase connection is working (anonymous key verified)
- ❌ Table does not exist yet - manual creation required
- ❌ Service role key provided is invalid/incorrect format

## 🛠️ Manual Setup Process

### Step 1: Access Supabase SQL Editor
1. Go to: [https://dbnfkzctensbpktgbsgn.supabase.co/project/default/sql](https://dbnfkzctensbpktgbsgn.supabase.co/project/default/sql)
2. Make sure you're logged in with admin privileges

### Step 2: Execute the SQL Schema
Copy and paste the entire contents of `quick-setup-supplier-orders.sql` into the SQL editor and run it.

The SQL includes:
- Table creation with all required columns
- Indexes for performance
- Triggers for automatic timestamp updates
- Row Level Security policies
- Statistics view for reporting
- Demo data for testing

### Step 3: Verify Setup
Run the verification script:
```bash
node verify-supplier-table.js
```

## 📊 Table Schema Overview

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `customer_name` | VARCHAR(255) | Customer full name |
| `customer_email` | VARCHAR(255) | Customer email address |
| `customer_phone` | VARCHAR(50) | Customer phone number |
| `product_sku` | VARCHAR(100) | Product SKU code |
| `product_name` | VARCHAR(255) | Product display name |
| `color_variant` | VARCHAR(100) | Color variant (optional) |
| `quantity` | INTEGER | Requested quantity (default: 1) |
| `message` | TEXT | Customer message/notes |
| `status` | VARCHAR(50) | Order status (enum) |
| `priority` | VARCHAR(20) | Priority level (enum) |
| `supplier_contact_info` | JSONB | Supplier contact details |
| `supplier_notes` | TEXT | Internal supplier notes |
| `admin_notes` | TEXT | Admin/management notes |
| `estimated_delivery` | DATE | Expected delivery date |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time (auto) |
| `contacted_at` | TIMESTAMP | When supplier was contacted |
| `completed_at` | TIMESTAMP | When order was completed |

## 🔐 Security Features
- Row Level Security (RLS) enabled
- Public policies for demo (adjust for production)
- Proper data validation with CHECK constraints

## 📈 Performance Features
- Index on `status` column for quick filtering
- Index on `created_at` column for chronological ordering
- Statistics view for dashboard reporting

## 🧪 Demo Data
The setup includes 2 demo records:
1. Jan Novák - High priority wallet order
2. Marie Svobodová - Normal priority backpack order

## ✅ After Setup Completion

Once the table is created, you can:

1. **Test the system**: Run `node verify-supplier-table.js`
2. **View records**: Check the Supabase dashboard or use the API
3. **Start development**: Begin integrating with your e-shop frontend
4. **Monitor orders**: Use the `order_statistics` view for reporting

## 🚨 Production Considerations

Before going live, consider:
- [ ] Adjusting RLS policies for proper access control
- [ ] Setting up proper authentication
- [ ] Configuring email notifications for new orders
- [ ] Setting up admin dashboard for order management
- [ ] Adding data retention policies if needed

## 📝 Available Scripts

- `validate-and-setup.js` - Check connection and show setup instructions
- `verify-supplier-table.js` - Verify table functionality after setup
- `quick-setup-supplier-orders.sql` - Complete SQL schema

## 🆘 Troubleshooting

**If verification fails:**
1. Check that you executed ALL the SQL from the file
2. Ensure you have proper permissions in Supabase
3. Check the Supabase logs for any error messages
4. Verify the table appears in the Supabase dashboard

**If you need a different service role key:**
1. Go to Supabase Project Settings → API
2. Copy the `service_role` key (not the `anon` key)
3. Update the scripts with the correct key

## 🔄 Next Steps After Setup
1. Integrate with your e-shop frontend
2. Create admin interface for order management
3. Set up email notifications
4. Configure supplier contact workflows
5. Add reporting and analytics features