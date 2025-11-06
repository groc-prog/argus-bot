import logger from '../utils/logger';

export default abstract class ServiceBase {
  private static instances = new Map<new () => unknown, unknown>();
  protected logger = logger.child({ service: this.constructor.name });

  /**
   * Initial setup work the service has to perform. This may include things like registering
   * CRON jobs, doing database queries, etc.
   * @abstract
   * @returns {Bun.MaybePromise<void>}
   */
  abstract initialize(): Bun.MaybePromise<void>;

  /**
   * Gets the current (singleton) instance of the service.
   * @template T - The type of the singleton service.
   * @returns Either a new lazily initialized instance or a already created instance of `T`
   */
  public static currentInstance<T>(this: new () => T): T {
    if (!ServiceBase.instances.has(this)) {
      ServiceBase.instances.set(this, new this());
    }

    return ServiceBase.instances.get(this) as T;
  }
}
