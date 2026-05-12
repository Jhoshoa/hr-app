import { Injectable } from "@nestjs/common";
import type { DomainEvent } from "./domain-event.interface";
import type { EventBus } from "./event-bus.port";

@Injectable()
export class InMemoryEventBusAdapter implements EventBus {
  publish = async (_event: DomainEvent): Promise<void> => {
    return Promise.resolve();
  };

  publishMany = async (events: DomainEvent[]): Promise<void> => {
    await Promise.all(events.map((event) => this.publish(event)));
  };
}
