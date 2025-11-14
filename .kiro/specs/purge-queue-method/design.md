# Design Document: purgeQueue Method Implementation

## Overview

This design document outlines the implementation of the `purgeQueue` method across all storage adapters in Badger MQ Lite. The method will remove all acknowledged messages from a specified queue while preserving unacknowledged messages. The implementation will maintain consistency across all adapters (memory, file, SQLite, MySQL) and follow the existing adapter interface patterns.

## Architecture

### Adapter Interface Extension

The `purgeQueue` method will be added to the existing adapter interface alongside other queue management methods:

```javascript
{
  createQueue(queueName),
  listQueues(),
  deleteQueue(queueName),
  sendMessage(queueName, body),
  ackMessage(queueName, messageId),
  receiveMessage(queueName),
  getMessages(queueName),
  purgeQueue(queueName)  // NEW METHOD
}
```

### Method Signature

**Synchronous (Memory Adapter):**
```javascript
purgeQueue(name: string): number
```

**Asynchronous (File, SQLite, MySQL Adapters):**
```javascript
purgeQueue(name: string): Promise<number>
```

**Parameters:**
- `name` (string): The name of the queue to purge

**Returns:**
- `number`: Count of acknowledged messages removed from the queue

## Components and Interfaces

### 1. Memory Adapter (`adapters/memory/memory.js`)

**Implementation Strategy:**
- Filter the queue array to remove messages where `acked === true`
- Count removed messages before filtering
- Update the in-memory queues object with the filtered array
- Return the count of removed messages

**Key Considerations:**
- Synchronous operation (no I/O)
- Handle non-existent queues gracefully (return 0)
- Preserve message order for remaining unacked messages

### 2. File Adapter (`adapters/file/index.js`)

**Implementation Strategy:**
- Load the queue from the JSON file using `loadQueue(name)`
- Filter messages to keep only unacknowledged ones (`acked === false`)
- Calculate the count of removed messages
- Save the filtered queue back to the file using `saveQueue(name, queue)`
- Return the count of removed messages

**Key Considerations:**
- Asynchronous operation (file I/O)
- Atomic file write to prevent corruption
- Handle non-existent queue files (return 0)
- Maintain JSON formatting consistency

### 3. SQLite Adapter (`adapters/sqlite/index.js`)

**Implementation Strategy:**
- Initialize database connection using `initDb()`
- Execute DELETE query: `DELETE FROM messages WHERE queue = ? AND acked = 1`
- Capture the number of affected rows from the result
- Return the count of deleted messages

**Key Considerations:**
- Asynchronous operation (database I/O)
- Use parameterized queries to prevent SQL injection
- Leverage SQLite's atomic transaction handling
- Handle database connection errors

### 4. MySQL Adapter (`adapters/mysql/mysql.js`)

**Implementation Strategy:**
- Execute DELETE query using connection pool: `DELETE FROM messages WHERE queue = ? AND acked = 1`
- Extract `affectedRows` from the result array
- Return the count of deleted messages

**Key Considerations:**
- Asynchronous operation (database I/O)
- Use parameterized queries to prevent SQL injection
- Leverage connection pool for efficiency
- Handle database connection errors
- Fix existing bug in `purgeQueue` method (currently has incorrect implementation)

### 5. Redis Adapter (`adapters/redis/redis.js`)

**Implementation Strategy:**
- Not implemented in current scope (file is empty)
- Design placeholder for future implementation
- Would use Redis LIST operations with LREM or similar commands

**Key Considerations:**
- Deferred to future implementation when Redis adapter is built

## Data Models

### Message Structure

All adapters work with a consistent message structure:

```javascript
{
  id: string | number,        // UUID (memory/file/MySQL) or auto-increment (SQLite)
  queue: string,              // Queue name (SQLite/MySQL only)
  body: object | string,      // Message payload (JSON string in DB adapters)
  acked: boolean | number,    // true/1 = acknowledged, false/0 = unacknowledged
  created_at?: string         // Timestamp (SQLite/MySQL only)
}
```

### Return Value

All `purgeQueue` implementations return a simple numeric count:

```javascript
number  // Count of messages removed (0 or positive integer)
```

## Error Handling

### Memory Adapter
- **Non-existent queue**: Return 0 (no error thrown)
- **Empty queue**: Return 0 (no error thrown)

### File Adapter
- **Non-existent queue file**: Return 0 (no error thrown)
- **File read error**: Throw error with descriptive message
- **File write error**: Throw error, original file remains intact
- **JSON parse error**: Throw error with descriptive message

### SQLite Adapter
- **Database connection error**: Throw error from `initDb()`
- **Query execution error**: Throw error with descriptive message
- **Non-existent queue**: Return 0 (no rows affected)

### MySQL Adapter
- **Database connection error**: Throw error from connection pool
- **Query execution error**: Throw error with descriptive message
- **Non-existent queue**: Return 0 (no rows affected)

### Error Message Format

Errors should be descriptive and include context:
```javascript
throw new Error(`Failed to purge queue '${name}': ${originalError.message}`);
```

## Testing Strategy

### Unit Testing Approach

For each adapter, test the following scenarios:

1. **Successful purge with mixed messages**
   - Create queue with both acked and unacked messages
   - Call purgeQueue
   - Verify only acked messages are removed
   - Verify correct count is returned

2. **Purge queue with only acked messages**
   - Create queue with only acked messages
   - Call purgeQueue
   - Verify queue becomes empty
   - Verify correct count is returned

3. **Purge queue with no acked messages**
   - Create queue with only unacked messages
   - Call purgeQueue
   - Verify no messages are removed
   - Verify count of 0 is returned

4. **Purge non-existent queue**
   - Call purgeQueue on a queue that doesn't exist
   - Verify no error is thrown
   - Verify count of 0 is returned

5. **Purge empty queue**
   - Create empty queue
   - Call purgeQueue
   - Verify count of 0 is returned

6. **Message order preservation**
   - Create queue with multiple unacked messages
   - Add some acked messages in between
   - Call purgeQueue
   - Verify unacked messages maintain their original order

### Integration Testing

Test purgeQueue in realistic workflows:

1. **Producer-Consumer-Purge workflow**
   - Send multiple messages
   - Receive and acknowledge some messages
   - Purge the queue
   - Verify only unacked messages remain

2. **Cross-adapter consistency**
   - Run same test suite across all adapters
   - Verify consistent behavior and return values

## Implementation Notes

### Existing Code Issues

The MySQL adapter already has a `purgeQueue` method, but it has bugs:
```javascript
async purgeQueue(name){
  await pool.query(`DELETE FROM messages WHERE acked = 1`)  // Missing WHERE queue = ?
  return { queue: name, deleted: result.affectedRows }      // 'result' is undefined
}
```

**Fixes needed:**
1. Add queue name filter to WHERE clause
2. Capture query result and extract affectedRows
3. Return number instead of object for consistency

### Documentation Updates

Update `README.md` to include:

1. Add `purgeQueue` to the API Reference section
2. Include usage example:
```javascript
// Purge acknowledged messages from a queue
const removedCount = await mq.purgeQueue("emailQueue");
console.log(`Removed ${removedCount} acknowledged messages`);
```

3. Add to the adapter interface documentation
4. Include in use case examples (e.g., periodic cleanup jobs)

## Performance Considerations

### Memory Adapter
- O(n) time complexity for filtering
- Minimal memory overhead
- Instant operation

### File Adapter
- O(n) time for filtering + file I/O
- Temporary memory for full queue during filter
- File write is the bottleneck

### SQLite Adapter
- O(n) time for DELETE operation
- Database handles memory efficiently
- Single query execution

### MySQL Adapter
- O(n) time for DELETE operation with index support
- Connection pool provides efficiency
- Network latency for remote databases

### Optimization Opportunities

1. **Batch operations**: For large queues, consider batch deletion
2. **Indexing**: Ensure `acked` column is indexed in database adapters
3. **Lazy purging**: Consider auto-purge on other operations to reduce explicit calls

## Security Considerations

1. **SQL Injection Prevention**: Use parameterized queries in all database adapters
2. **File System Access**: Validate queue names to prevent directory traversal
3. **Resource Limits**: Consider adding limits for very large purge operations
4. **Concurrent Access**: File adapter should handle concurrent purge operations safely

## Future Enhancements

1. **Purge with criteria**: Add optional parameters for time-based purging
2. **Dry-run mode**: Return count without actually deleting
3. **Purge callbacks**: Allow hooks for logging or monitoring
4. **Batch purging**: Purge multiple queues in one operation
5. **Auto-purge**: Automatic purging based on thresholds or schedules
