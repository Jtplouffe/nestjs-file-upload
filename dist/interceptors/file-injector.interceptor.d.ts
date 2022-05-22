import { CallHandler, ExecutionContext, NestInterceptor, Type } from "@nestjs/common";
import { Observable } from "rxjs";
export declare class FileInjectorInterceptor<T> implements NestInterceptor {
    private type;
    constructor(type: Type<T>);
    intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>>;
}
//# sourceMappingURL=file-injector.interceptor.d.ts.map