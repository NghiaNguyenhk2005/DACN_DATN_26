import { Injectable } from "@nestjs/common";
import { DemoResetRegistry, type Resettable } from "../../core/demo-reset.registry";
import {
  DEFAULT_SETTINGS,
  PlatformSettingsRepository,
  type PlatformSettingsUpdate,
  type ResolvedSettings,
} from "./platform-settings.repository";

@Injectable()
export class InMemoryPlatformSettingsRepository extends PlatformSettingsRepository implements Resettable {
  private current: ResolvedSettings = structuredClone(DEFAULT_SETTINGS);

  constructor(registry: DemoResetRegistry) {
    super();
    registry.register(this);
  }

  reset(): void {
    this.current = structuredClone(DEFAULT_SETTINGS);
  }

  async get(): Promise<ResolvedSettings> {
    return structuredClone(this.current);
  }

  async merge(changes: PlatformSettingsUpdate): Promise<ResolvedSettings> {
    this.current = { ...this.current, ...structuredClone(changes) };
    return structuredClone(this.current);
  }
}
