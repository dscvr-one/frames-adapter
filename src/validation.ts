import type {
  DscvrUntrustedData,
  DscvrFramesRequest,
  DscvrValidationResponse,
  ValidationType,
  ValidatedQueryResult,
  UnknownFrameRequest,
  UnknownUntrustedData,
} from './types';
import { dscvrClientProtocolPrefix } from './constants';
import { DEFAULT_DSCVR_API_URL } from './default';
import { useUrqlClient } from './clients';
import { validationQuery } from './queries/validation.query';

const validateField = (
  validated: ValidationType,
  untrusted: ValidationType,
): boolean => {
  return (!validated && !untrusted) || validated === untrusted;
};

const validateData = (
  validatedResult: DscvrValidationResponse,
  untrustedData: DscvrUntrustedData,
): boolean => {
  const isValidKey = (k: string): k is keyof DscvrValidationResponse =>
    k in validatedResult;

  const untrustedDataKeys = Object.keys(untrustedData);
  const isValid = untrustedDataKeys.reduce((valid, key) => {
    if (isValidKey(key)) {
      return valid && validateField(validatedResult[key], untrustedData[key]);
    }
    return false;
  }, true);

  return isValid;
};

export const isDscvrFrameUntrustedData = (
  untrustedData: UnknownUntrustedData,
): untrustedData is DscvrUntrustedData => {
  return (
    'dscvrId' in untrustedData &&
    typeof untrustedData.dscvrId === 'string' &&
    (!('contentId' in untrustedData) ||
      typeof untrustedData.contentId === 'string' ||
      untrustedData.contentId === null ||
      untrustedData.contentId === undefined) &&
    (!('state' in untrustedData) ||
      typeof untrustedData.state === 'string' ||
      untrustedData.state === null ||
      untrustedData.state === undefined)
  );
};

export const validateClientProtocol = (clientProtocol: string) => {
  return clientProtocol.startsWith(dscvrClientProtocolPrefix);
};

export const isDscvrFrameMessage = (
  frameActionPayload: UnknownFrameRequest,
): frameActionPayload is DscvrFramesRequest => {
  return (
    !!frameActionPayload.clientProtocol &&
    !!validateClientProtocol(frameActionPayload.clientProtocol) &&
    isDscvrFrameUntrustedData(frameActionPayload.untrustedData)
  );
};

export const validateDscvrFrameMessage = async (
  payload: DscvrFramesRequest,
  apiUrl = DEFAULT_DSCVR_API_URL,
): Promise<DscvrValidationResponse> => {
  const client = useUrqlClient(apiUrl);

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
