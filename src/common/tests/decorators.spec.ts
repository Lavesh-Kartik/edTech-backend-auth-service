import { CurrentUser } from '../decorators/current-user.decorator';
import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

describe('CurrentUserDecorator', () => {
  function getParamDecoratorFactory(decorator: Function) {
    class Test {
      public test(@decorator() value) {}
    }
    const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'test');
    return args[Object.keys(args)[0]].factory;
  }

  it('should return user from request', () => {
    const factory = getParamDecoratorFactory(CurrentUser);
    const result = factory(null, {
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: 1 } }),
      }),
    });
    expect(result).toEqual({ id: 1 });
  });

  it('should return specific property', () => {
    const factory = getParamDecoratorFactory(CurrentUser);
    const result = factory('id', {
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: 1 } }),
      }),
    });
    expect(result).toBe(1);
  });

  it('should return null if no user', () => {
    const factory = getParamDecoratorFactory(CurrentUser);
    const result = factory(null, {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    });
    expect(result).toBeNull();
  });
});
