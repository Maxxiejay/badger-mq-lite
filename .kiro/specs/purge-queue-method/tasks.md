# Implementation Plan

- [ ] 1. Implement purgeQueue in memory adapter



  - Add purgeQueue method to memory adapter object
  - Filter queue array to remove acked messages
  - Calculate and return count of removed messages
  - Handle non-existent queues by returning 0
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 3.1, 3.3, 4.1_

- [ ] 2. Implement purgeQueue in file adapter
  - Add async purgeQueue method to file adapter object
  - Load queue using existing loadQueue helper
  - Filter messages to keep only unacked messages
  - Calculate count of removed messages
  - Save filtered queue using existing saveQueue helper
  - Return count of removed messages
  - Handle non-existent queue files by returning 0
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.2, 3.1, 3.2, 3.3, 4.2, 4.5_

- [ ] 3. Implement purgeQueue in SQLite adapter
  - Add async purgeQueue method to SQLite adapter object
  - Initialize database using existing initDb function
  - Execute DELETE query with parameterized queue name and acked = 1
  - Extract changes count from query result
  - Return count of deleted messages
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.3, 3.1, 3.2, 3.3, 4.3, 4.5_

- [ ] 4. Fix and implement purgeQueue in MySQL adapter
  - Fix existing purgeQueue method implementation
  - Add queue name filter to WHERE clause
  - Properly capture query result
  - Extract affectedRows from result array
  - Return numeric count instead of object
  - Handle non-existent queues by returning 0
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.4, 3.1, 3.2, 3.3, 4.4, 4.5_

- [ ] 5. Update documentation
  - Add purgeQueue to API Reference se