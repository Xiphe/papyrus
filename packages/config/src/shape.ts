import isPlainObject from 'lodash.isplainobject';

export const OPTIONAL = Symbol('OPTIONAL');

type Primitive =
  | NumberConstructor
  | BooleanConstructor
  | StringConstructor
  | FunctionConstructor
  | SymbolConstructor
  | BigIntConstructor
  | null
  | undefined;

type Optional<T> = { [OPTIONAL]: T };

type ShapeType = Shape | Primitive | [Primitive] | [Shape];

export type Shape =
  | {
      [key: string]: ShapeType;
    }
  | [Shape]
  | [Primitive];

export type ShapeEntry =
  | Primitive
  | Optional<Primitive>
  | Shape
  | Optional<Shape>;

export function optional<T extends ShapeType>(type: T): Optional<T> {
  return {
    [OPTIONAL]: type,
  } as any;
}

export function isShape(entry: ShapeEntry): entry is Shape {
  return isOptional(entry) ? isShape(entry[OPTIONAL]) : isPlainObject(entry);
}

export function isOptional(
  type: Primitive | Optional<Primitive> | Shape | Optional<Shape>,
): type is Optional<Primitive> | Optional<Shape> {
  return type && typeof type === 'object' && (type as any)[OPTIONAL];
}

type ToPrimitiveType<T extends Primitive> = T extends NumberConstructor
  ? number
  : T extends BooleanConstructor
  ? boolean
  : T extends StringConstructor
  ? string
  : T extends BigIntConstructor
  ? bigint
  : T extends FunctionConstructor
  ? (...args: any) => any
  : T extends null
  ? null
  : T extends undefined
  ? undefined
  : never;

export type ToConfig<T extends Shape> = {
  [K in keyof T]: T[K] extends Optional<Primitive>
    ? ToPrimitiveType<T[K][typeof OPTIONAL]> | undefined
    : T[K] extends Primitive
    ? ToPrimitiveType<T[K]>
    : T[K] extends Optional<Shape>
    ? ToConfig<T[K][typeof OPTIONAL]> | undefined
    : T[K] extends Shape
    ? ToConfig<T[K]>
    : never;
};

const primitives = [Number, Boolean, String, BigInt, Function, Symbol];

function validateNested(
  value: any,
  entry: ShapeEntry,
  parentKeys: string[] = [],
): true {
  if (entry === undefined) {
    if (value !== undefined) {
      throw new Error(`Expect ${parentKeys.join('.')} to be undefined`);
    }
    return true;
  } else if (entry === null) {
    if (value !== null) {
      throw new Error(`Expect ${parentKeys.join('.')} to be null`);
    }
    return true;
  } else if (isOptional(entry)) {
    if (value === undefined || value === null) {
      return true;
    }
    return validateNested(value, entry[OPTIONAL], parentKeys);
  } else if (isShape(entry)) {
    if (!isPlainObject(value)) {
      throw new Error(`Expect ${parentKeys.join('.')} to be Shape`);
    }

    Object.entries(entry).forEach(([key, subEntry]) => {
      validateNested(value[key], subEntry, parentKeys.concat(key));
    });
    return true;
  } else if (Array.isArray(entry)) {
    if (Array.isArray(value)) {
      entry.forEach((subEntry, i) => {
        validateNested(value[0], subEntry, parentKeys.concat(i.toString()));
      });
      return true;
    }
    throw new Error(`Expect ${parentKeys.join('.')} to be Array`);
  } else if (primitives.includes(entry)) {
    if (value !== undefined && value.constructor === entry) {
      return true;
    }
    throw new Error(`Expect ${parentKeys.join('.')} to be a ${entry.name}`);
  }

  throw new Error('Unexpected validation case');
}

export function validate<S extends Shape>(
  values: any,
  shape: S,
): values is ToConfig<S> {
  return validateNested(values, shape);
}

function convertType(value: any, type: any, keys: string[]) {
  if (value === undefined || type === undefined || type === null) {
    return undefined;
  }

  switch (type) {
    case String:
      return String(value);
    case Boolean:
      return ['true', '1'].includes(value)
        ? true
        : ['false', '0', 'null'].includes(value)
        ? false
        : Boolean(value);
    case BigInt:
      return BigInt(value);
    case Number:
      return parseInt(value, 10);
    case Symbol:
      return Symbol(value);
    default:
      throw new Error(
        `Can not convert ${keys.join('.')} into ${type.name || type}`,
      );
  }
}

export function extract(
  entry: ShapeEntry,
  getValue: (keys: string[]) => string | undefined,
  parentKeys: string[] = [],
  optional: boolean = false,
): { [key: string]: unknown } | unknown {
  if (isOptional(entry)) {
    return extract(entry[OPTIONAL], getValue, parentKeys, true);
  }

  if (isPlainObject(entry)) {
    const subValues = Object.entries(entry as Shape).reduce(
      (memo, [key, value]) => {
        const v = extract(value, getValue, parentKeys.concat(key));

        if (v !== undefined) {
          memo[key] = v;
        }

        return memo;
      },
      {} as any,
    );

    if (optional) {
      return Object.keys(subValues).length ? subValues : undefined;
    }

    return subValues;
  }

  if (Array.isArray(entry)) {
    const val = getValue(parentKeys);
    if (val) {
      return val
        .split(',')
        .map((v: string, i) =>
          convertType(v, entry[0], parentKeys.concat(i.toString())),
        );
    }
    return val;
  }

  return convertType(getValue(parentKeys), entry, parentKeys);
}
