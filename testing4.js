const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const {format, isValid, isMatch} = require('date-fns')
const app = express()
const dbpath = path.join(__dirname, 'todoApplication.db')
let db = null
const intializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
intializeDBandServer()
app.use(express.json())

const hasPriorityAndstatusProperites = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

const hasCategoryStatus = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}

const hasCategoryAndPriority = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}

const hasSearchProperty = requestQuery => {
  return requestQuery.search_q !== undefined
}

const hasCategoryProperty = requestQuery => {
  return requestQuery.category !== undefined
}

const outPutResult = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  }
}

app.get('/todos/', async (request, response) => {
  let getTodoQuery = ''
  let data = null
  const {search_q = '', priority, status, category} = request.query

  switch (true) {
    case hasPriorityAndstatusProperites(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodoQuery = `
      SELECT * 
      FROM todo 
      WHERE 
      status   = '${status}'
      AND priority = '${priority}'`
          data = await db.all(getTodoQuery)
          response.send(data.map(i => outPutResult(i)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case hasCategoryStatus(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodoQuery = `
      SELECT * 
      FROM todo 
      WHERE 
      category   = '${category}'
      AND status = '${status}'`
          data = await db.all(getTodoQuery)
          response.send(data.map(i => outPutResult(i)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }

      break

    case hasCategoryAndPriority(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          priority === 'HIGH' ||
          priority === 'MEDIUM' ||
          priority === 'LOW'
        ) {
          getTodoQuery = `
      SELECT * 
      FROM todo 
      WHERE 
      category   = '${category}'
      AND priority = '${priority}'`
          data = await db.all(getTodoQuery)
          response.send(data.map(i => outPutResult(i)))
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }

      break
    case hasPriorityProperty(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        getTodoQuery = `
          SELECT * 
          FROM todo 
          WHERE  priority = '${priority}'`
        data = await db.all(getTodoQuery)
        response.send(data.map(i => outPutResult(i)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }

      break
    case hasStatusProperty(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getTodoQuery = `
          SELECT * 
        FROM todo 
        WHERE  status = '${status}'`
        data = await db.all(getTodoQuery)
        response.send(data.map(i => outPutResult(i)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }

      break
    case hasSearchProperty(request.query):
      getTodoQuery = `select * from todo where todo like '%${search_q}%';`
      data = await db.all(getTodoQuery)
      response.send(data.map(eachItem => outPutResult(eachItem)))
      break
    case hasCategoryProperty(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        getTodoQuery = `
          SELECT * 
          FROM todo 
          WHERE  category = '${category}'`
        data = await db.all(getTodoQuery)
        response.send(data.map(i => outPutResult(i)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }

      break
    default:
      getTodoQuery = `
   SELECT * 
   FROM todo`
      data = await db.all(getTodoQuery)
      response.send(data.map(i => outPutResult(i)))
  }
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const api2 = `
  SELECT * 
  from todo 
  WHERE id = ${todoId}`

  const finalOne = await db.get(api2)
  response.send(outPutResult(finalOne))
})

app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  const isDateValid = isValid(new Date(date))
  if (!isDateValid) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    const formattedDate = format(new Date(date), 'yyyy-MM-dd')
    const selectQuery = `
  SELECT 
  id,
  todo,
  priority,
  status,
  category,
  due_date AS dueDate 
  FROM todo 
  WHERE due_date = '${formattedDate}' `

    const dueDateSignal = await db.all(selectQuery)
    response.send(dueDateSignal)
  }
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  if (priority === 'HIGH' || priority === 'LOW' || priority === 'MEDIUM') {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const postNewDate = format(new Date(dueDate), 'yyyy-MM-dd')

          const todoQueryFive = `
        INSERT INTO todo (id, todo, priority , status, category, due_date) 
        VALUES(
          ${id},
          '${todo}',
          '${priority}',
          '${status}',
          '${category}',
          '${postNewDate}'
          )`
          const dbResponseFive = await db.run(todoQueryFive)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const requestBody = request.body
  const argumenting = `
  SELECT * 
  FROM todo 
  WHERE id = ${todoId}`
  const finalOne = await db.get(argumenting)
  const {
    todo = finalOne.todo,
    priority = finalOne.priority,
    status = finalOne.status,
    category = finalOne.category,
    dueDate = finalOne.dueDate,
  } = request.body

  let updateTodoQuery
  switch (true) {
    case requestBody.status !== undefined:
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        updateTodoQuery = `UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${dueDate}' WHERE id = ${todoId};`

        await db.run(updateTodoQuery)
        response.send('Status Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case requestBody.priority !== undefined:
      if (priority === 'HIGH' || priority === 'LOW' || priority === 'MEDIUM') {
        updateTodoQuery = `UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${dueDate}' WHERE id = ${todoId};`

        await db.run(updateTodoQuery)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case requestBody.todo !== undefined:
      updateTodoQuery = `UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${dueDate}' WHERE id = ${todoId};`

      await db.run(updateTodoQuery)
      response.send('Todo Updated')
      break

    case requestBody.category !== undefined:
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        updateTodoQuery = `UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${dueDate}' WHERE id = ${todoId};`

        await db.run(updateTodoQuery)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, 'yyyy-MM-dd')) {
        const newDueDate = format(new Date(dueDate), 'yyyy-MM-dd')
        updateTodoQuery = `UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${dueDate}' WHERE id = ${todoId};`

        await db.run(updateTodoQuery)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
  }
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`

  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
