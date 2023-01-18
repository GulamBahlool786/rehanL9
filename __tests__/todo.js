/* eslint-disable no-undef */
const request = require("supertest");
var cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");
//const todo = require("../models/todo");
let server, agent;

function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

describe("Todo test suite ", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });
  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });
  test("Create new todo", async () => {
    const res = await agent.get("/todos");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Go to market",
      dueDate: new Date().toISOString(),
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Update a todo with regestered ID as complete / Incomplete", async () => {
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy meat",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    const gropuedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(gropuedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];
    const status = true;
    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    const response = await agent.put(`todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
      completed: true,
    });
    const newparsedUpdateResponse = JSON.parse(response.text);
    expect(newparsedUpdateResponse.completed).toBe(true);
    completedstatus = false;
    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);
    var response1 = await agent.put(`/todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
      completed: completedstatus,
    });
    console.log(response.text);
    var newparsedUpdateResponse1 = JSON.parse(response1.text);
    expect(newparsedUpdateResponse1.completed).toBe(false);
  });

  test(" Delete todo using ID", async () => {
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Dance with Friends",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const gropuedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(gropuedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    const Deleteresponse = await agent.put(`todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
    });
    const deletestatus = JSON.parse(Deleteresponse.text);
    deletestatus? expect(deletestatus).toBe(true):expect(deletestatus).toBe(false);
  });
});
