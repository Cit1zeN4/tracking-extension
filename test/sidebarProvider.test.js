"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const sidebarProvider_1 = require("../src/sidebarProvider");
const timerService_1 = require("../src/timerService");
const taskService_1 = require("../src/taskService");
const vscode = __importStar(require("vscode"));
suite('SidebarProvider Test Suite', () => {
    let timerService;
    let taskService;
    let sidebarProvider;
    suiteSetup(() => {
        const context = {
            extensionUri: vscode.Uri.file(''),
        };
        timerService = new timerService_1.TimerService(context);
        taskService = new taskService_1.TaskService(context);
        sidebarProvider = new sidebarProvider_1.SidebarProvider(context.extensionUri, timerService, taskService);
    });
    test('SidebarProvider should be created', () => {
        assert.ok(sidebarProvider);
    });
    test('TimerService integration', () => {
        const state = timerService.getState();
        assert.ok(state);
        assert.equal(state.isRunning, false);
    });
    test('TaskService integration', () => {
        const tasks = taskService.getTasks();
        assert.ok(Array.isArray(tasks));
    });
});
//# sourceMappingURL=sidebarProvider.test.js.map