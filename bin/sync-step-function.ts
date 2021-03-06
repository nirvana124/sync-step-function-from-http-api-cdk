#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { SyncStepFunctionStack } from '../lib/sync-step-function-stack';

const app = new cdk.App();
new SyncStepFunctionStack(app, 'SyncStepFunctionStack');
