# Flow Documentation

## Marketplace Flow
1. Browse product list
2. Open product detail
3. Add to cart
4. Checkout
5. Payment success
6. Order success and audit log

## Apply -> Approval Flow
1. Candidate submits /apply/:role
2. Application recorded in DB
3. Approval queue reviewed in control panel
4. Approve/reject updates status and audit trail

## Order -> Payment -> Delivery Flow
1. UI action starts flow lock (ui)
2. API request (api)
3. Persistence operation (db)
4. Event emission (event)
5. UI refresh/acknowledge (ui-refresh)

## Support Flow
1. User issue captured
2. Ticket routed to support module
3. Action performed + logged
4. Resolution communicated to requester
