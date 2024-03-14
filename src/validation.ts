import { Client, cacheExchange, fetchExchange } from '@urql/core';
import {
  type DscvrFramesRequest,
  type DscvrValidationResponse,
  dscvrClientProtocolPrefix,
  DscvrUntrustedData,
} from './types';
import { DEFAULT_DSCVR_API_URL } from './default';

type ValidationType = string | number | bigint | null | undefined;
interface ValidatedQueryResult {
  user: {
    id: string;
  };
  content?: {
    id: string;
  };
  state: string | null;
  inputText: string | null;
  timestamp: string;
  url: string;
  buttonIndex: number;
}

const validationQuery = `#graphql
    query validate($message: String!) {
      unpackFrameMessage(message: $message) {
        user {
            id
        },
        content {
            id
        }
        buttonIndex,
        state,
        url,
        timestamp,
        inputText,
      }
    }
`;

export const validateClientProtocol = (clientProtocol: string) => {
  return clientProtocol.startsWith(dscvrClientProtocolPrefix);
};

const validateField = (
  validated: ValidationType,
  untrusted: ValidationType
): boolean => {
  return (!validated && !untrusted) || validated === untrusted;
};

const validateData = (
  validatedResult: DscvrValidationResponse,
  untrustedData: DscvrUntrustedData
): boolean => {
  if (
    validateField(validatedResult.dscvrId, untrustedData.dscvrId) &&
    validateField(validatedResult.contentId, untrustedData.contentId) &&
    validateField(validatedResult.buttonIndex, untrustedData.buttonIndex) &&
    validateField(validatedResult.url, untrustedData.url) &&
    validateField(validatedResult.inputText, untrustedData.inputText) &&
    validateField(validatedResult.state, untrustedData.state) &&
    validateField(
      validatedResult.timestamp,
      Number(untrustedData.timestamp) // TODO: remove this when Proxy is fixed
    )
  ) {
    return true;
  }

  return false;
};

export const validateFramesPost = async (
  payload: DscvrFramesRequest,
  url = DEFAULT_DSCVR_API_URL
): Promise<DscvrValidationResponse> => {
  const client = new Client({
    url,
    exchanges: [cacheExchange, fetchExchange],
  });

  const result = await client.query<
    { unpackFrameMessage: ValidatedQueryResult },
    { message: string }
  >(validationQuery, {
    message: payload.trustedData.messageBytes,
  });

  if (!result.data) {
    throw new Error(`Invalid request: ${result.error?.message}`);
  }
  const queryResult = result.data.unpackFrameMessage;

  const user = queryResult.user;
  const content = queryResult.content;
  const hasContent = !!payload.untrustedData.contentId;
  if (!content && hasContent) {
    throw new Error('Invalid content');
  }

  const validatedResult: DscvrValidationResponse = {
    dscvrId: user.id,
    contentId: content?.id,
    inputText: queryResult.inputText || undefined,
    buttonIndex: queryResult.buttonIndex,
    state: queryResult.state || undefined,
    url: queryResult.url,
    timestamp: Number(queryResult.timestamp),
  };

  if (!validateData(validatedResult, payload.untrustedData)) {
    throw new Error('Invalid payload');
  }

  return validatedResult;
};
