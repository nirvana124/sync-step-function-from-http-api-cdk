import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as SyncStepFunction from '../lib/sync-step-function-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new SyncStepFunction.SyncStepFunctionStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
