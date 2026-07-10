const axios = require('axios');

const FLOWABLE_USER = process.env.FLOWABLE_USER || 'admin';
const FLOWABLE_PASS = process.env.FLOWABLE_PASS || 'admin';
const FLOWABLE_BASE = process.env.FLOWABLE_BASE || 'http://localhost:8080/flowable-ui/process-api';

const FLOWABLE_AUTH = 'Basic ' + Buffer.from(`${FLOWABLE_USER}:${FLOWABLE_PASS}`).toString('base64');

const headers = {
  'Content-Type': 'application/json',
  Authorization: FLOWABLE_AUTH,
};

async function flowableRequest(method, path, data, params) {
  const url = `${FLOWABLE_BASE}${path}`;
  const response = await axios({
    method,
    url,
    headers,
    data,
    params,
    timeout: 30000,
  });
  return response.data;
}

function toVariable(name, value, type = 'string') {
  return { name, value, type };
}

async function startProcess(processDefinitionKey, variables) {
  return flowableRequest('POST', '/runtime/process-instances', {
    processDefinitionKey,
    variables: variables.map((v) => toVariable(v.name, v.value, v.type || 'string')),
  });
}

async function getTask(taskId) {
  return flowableRequest('GET', `/runtime/tasks/${taskId}`);
}

async function claimTask(taskId, userId) {
  return flowableRequest('POST', `/runtime/tasks/${taskId}`, {
    action: 'claim',
    assignee: userId,
  });
}

async function completeTask(taskId, variables = []) {
  return flowableRequest('POST', `/runtime/tasks/${taskId}`, {
    action: 'complete',
    variables: variables.length
      ? variables.map((v) => toVariable(v.name, v.value, v.type || 'string'))
      : undefined,
  });
}

async function getProcessVariables(processInstanceId) {
  try {
    return await flowableRequest('GET', `/runtime/process-instances/${processInstanceId}/variables`);
  } catch (err) {
    if (err.response?.status === 404) {
      const hist = await flowableRequest('GET', '/history/historic-variable-instances', null, {
        processInstanceId,
        size: 200,
      });
      return (hist.data || []).map((v) => ({
        name: v.variableName,
        value: v.value,
        type: v.variableTypeName || 'string',
      }));
    }
    throw err;
  }
}

async function saveProcessVariable(processInstanceId, name, value) {
  const body = toVariable(name, value);
  try {
    await flowableRequest('PUT', `/runtime/process-instances/${processInstanceId}/variables/${name}`, body);
  } catch (err) {
    if (err.response?.status === 404) {
      await flowableRequest('POST', `/runtime/process-instances/${processInstanceId}/variables`, [body]);
    } else {
      throw err;
    }
  }
}

async function appendComment(processInstanceId, comment) {
  const vars = await getProcessVariables(processInstanceId);
  const existing = vars.find((v) => v.name === 'comments');
  let list = [];
  if (existing?.value) {
    try {
      list = JSON.parse(String(existing.value));
      if (!Array.isArray(list)) list = [];
    } catch {
      list = [];
    }
  }
  list.push(comment);
  await saveProcessVariable(processInstanceId, 'comments', JSON.stringify(list));
  return list;
}

async function appendAttachmentMeta(processInstanceId, meta) {
  const vars = await getProcessVariables(processInstanceId);
  const existing = vars.find((v) => v.name === 'attachments');
  let list = [];
  if (existing?.value) {
    try {
      list = JSON.parse(String(existing.value));
      if (!Array.isArray(list)) list = [];
    } catch {
      list = [];
    }
  }
  list.push(meta);
  await saveProcessVariable(processInstanceId, 'attachments', JSON.stringify(list));
  return list;
}

async function getTasksByAssignee(assignee) {
  const data = await flowableRequest('GET', '/runtime/tasks', null, {
    assignee,
    size: 100,
  });
  return data.data || [];
}

async function getTasksByCandidateGroup(group) {
  const data = await flowableRequest('GET', '/runtime/tasks', null, {
    candidateGroup: group,
    size: 100,
  });
  return data.data || [];
}

async function getHistoricTasks(processInstanceId) {
  const data = await flowableRequest('GET', '/history/historic-task-instances', null, {
    processInstanceId,
    size: 100,
    sort: 'startTime',
    order: 'asc',
  });
  return data.data || [];
}

async function getRuntimeInstances(processDefinitionKey) {
  const data = await flowableRequest('GET', '/runtime/process-instances', null, {
    processDefinitionKey,
    size: 100,
  });
  return data.data || [];
}

async function getHistoricInstances(processDefinitionKey) {
  const data = await flowableRequest('GET', '/history/historic-process-instances', null, {
    processDefinitionKey,
    size: 100,
    includeProcessVariables: true,
  });
  return data.data || [];
}

module.exports = {
  FLOWABLE_BASE,
  FLOWABLE_AUTH,
  FLOWABLE_USER,
  FLOWABLE_PASS,
  flowableRequest,
  startProcess,
  getTask,
  claimTask,
  completeTask,
  getProcessVariables,
  saveProcessVariable,
  appendComment,
  appendAttachmentMeta,
  getTasksByAssignee,
  getTasksByCandidateGroup,
  getHistoricTasks,
  getRuntimeInstances,
  getHistoricInstances,
};
