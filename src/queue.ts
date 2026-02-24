import { EventEmitter } from "events";
import { CallRecord } from "./call-record.i";

export interface BatchJob {
  records: CallRecord[];
}

const emitter = new EventEmitter();

export function subscribe(handler: (job: BatchJob) => void): void {
  emitter.on("job", handler);
}

export function enqueue(job: BatchJob): void {
  emitter.emit("job", job);
}
