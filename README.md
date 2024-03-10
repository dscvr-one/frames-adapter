# Frames Adapter

Frames Adapter is a small typescript library designed to validate the payload from a signed frames POST call for DSCVR frames.

## Installation

You can install Frames Adapter via npm:

```bash
npm install @dscvr-one/frames-adapter
```

yarn

```bash
yarn add @dscvr-one/frames-adapter
```

## Usage

To use Frames Adapter, simply import it into your typescript project:

```typescript
import {
  type DscvrFramesRequest,
  type DscvrClientProtocol,
  type DscvrFrameActionData,
  validateClientProtocol,
  validateFramesPost,
} from '@dscvr-one/frames-adapter';
```

Then, you can use the functions provided by Frames Adapter to validate a Frame Post payload.

### Example

```typescript
import {
  type DscvrFramesRequest,
  type DscvrClientProtocol,
  type DscvrFrameActionData,
  validateClientProtocol,
  validateFramesPost,
} from '@dscvr-one/frames-adapter';

export const isDscvrFrameActionPayload = (
  frameActionPayload: FrameActionPayload
): frameActionPayload is DscvrFramesRequest => {
  return (
    !!frameActionPayload.clientProtocol &&
    validateClientProtocol(frameActionPayload.clientProtocol)
  );
};

export const getDscvrFrameMessage = async (
  frameActionPayload: DscvrFramesRequest
) => {
  const { actionBody, verifiedDscvrId, verifiedContentId } =
    await validateFramesPost({
      ...frameActionPayload,
      clientProtocol: frameActionPayload.clientProtocol as DscvrClientProtocol,
    });

  return {
    ...actionBody,
    verifiedDscvrId,
    verifiedContentId,
  };
};
```

Expected payload should have the next structure

```json
{
  "clientProtocol": "dscvr@...",
  "untrustedData": {
    "dscvrId": "...",
    "contentId": 123,
    "state": "...",
    "url": "...",
    "timestamp": 123,
    "buttonIndex": 1,
    "inputText": "..."
  },
  "trustedData": {
    "messageBytes": "..."
  }
}
```

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvement, feel free to open an issue or submit a pull request.

### Take in count

- `@open-frames/types` should remain in the `devDependencies` section of the **package.json** file, otherwise when imported by frames.js XMPT will have conflicts in typescript.
- type `DscvrUntrustedData` in file **src/types.ts** should be a type with the `&&` operator and not an interface with extend, otherwise a [type predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) wont work e.g:

```typescript
const fn = (payload: T): payload is DscvrFramesRequest
```
