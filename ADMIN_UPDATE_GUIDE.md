# Admin Panel Update Feature

## How to Update Shipments

The admin panel now has full CRUD (Create, Read, Update, Delete) functionality for shipments.

### To Update a Shipment:

1. **Navigate to Shipments Section**
   - Click on "Shipments" in the sidebar
   - You'll see a table with all shipments

2. **Click the Edit Button**
   - Each shipment row has three action buttons:
     - 🖊️ **Edit** (blue) - Opens the edit modal
     - 👁️ **View** (blue) - View tracking details
     - 🗑️ **Delete** (red) - Delete the shipment

3. **Edit Modal Opens**
   - The form is pre-filled with current shipment data
   - You can modify:
     - Tracking Number
     - Carrier
     - Origin
     - Destination
     - Current Location
     - Status (Pending/In Transit/Delivered)
     - Estimated Delivery Date

4. **Save Changes**
   - Click "Save Changes" button
   - The system will:
     - Update the shipment in the database
     - Show success message
     - Refresh the shipments table
     - Update dashboard statistics

### What Gets Updated:

The following fields can be edited:
- ✅ Tracking Number
- ✅ Carrier
- ✅ Origin Location
- ✅ Destination Location
- ✅ Current Location
- ✅ Status
- ✅ Estimated Delivery Date

### API Endpoint Used:

```
PUT /api/shipments/:id
```

The backend endpoint updates the shipment and automatically sets the `updated_at` timestamp.

### Important Notes:

- The edit form validates all required fields
- Changes are saved immediately to the database
- The dashboard stats update automatically after an edit
- If the update fails, you'll see an error message

### Troubleshooting:

If you can't update a shipment:
1. Make sure the database is running
2. Check that the server is started (`npm start`)
3. Verify the shipment exists in the database
4. Check browser console for errors (F12)

---

**Full Admin Features:**
- ✅ Create Shipment (with full sender/receiver/package details)
- ✅ View All Shipments
- ✅ Edit/Update Shipments
- ✅ Delete Shipments
- ✅ Track Shipment Events
- ✅ Dashboard Statistics
- ✅ File Upload (Invoices/Receipts)
