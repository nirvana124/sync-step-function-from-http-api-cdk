import { CfnIntegration, CfnRoute, HttpApi, HttpConnectionType, HttpMethod, HttpRouteKey, PayloadFormatVersion } from '@aws-cdk/aws-apigatewayv2';
import { Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from '@aws-cdk/aws-iam';
import { Code, Function, Runtime } from '@aws-cdk/aws-lambda';
import { LogGroup, RetentionDays } from '@aws-cdk/aws-logs';
import { Topic } from '@aws-cdk/aws-sns';
import { SqsSubscription } from '@aws-cdk/aws-sns-subscriptions';
import { Queue } from '@aws-cdk/aws-sqs';
import { Choice, Condition, Pass, StateMachine, StateMachineType, TaskInput } from '@aws-cdk/aws-stepfunctions';
import { LambdaInvoke, SnsPublish } from '@aws-cdk/aws-stepfunctions-tasks';
import * as cdk from '@aws-cdk/core';
import { CfnOutput } from '@aws-cdk/core';

export class SyncStepFunctionStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const openCaseLambda = new Function(this, 'OpenCase', {
      code: Code.fromAsset('functions'),
      handler: 'openCase.handler',
      runtime: Runtime.NODEJS_14_X
    });

    const assignCaseLambda = new Function(this, 'AssignCase', {
      code: Code.fromAsset('functions'),
      handler: 'assignCase.handler',
      runtime: Runtime.NODEJS_14_X
    });

    const handleCaseLambda = new Function(this, 'HandleCase', {
      code: Code.fromAsset('functions'),
      handler: 'handleCase.handler',
      runtime: Runtime.NODEJS_14_X
    });

    const closeCaseLambda = new Function(this, 'CloseCase', {
      code: Code.fromAsset('functions'),
      handler: 'closeCase.handler',
      runtime: Runtime.NODEJS_14_X
    });

    const escalateCaseLambda = new Function(this, 'EscalateCase', {
      code: Code.fromAsset('functions'),
      handler: 'escalateCase.handler',
      runtime: Runtime.NODEJS_14_X
    });

    const topic = new Topic(this, 'EscalationTopic');
    topic.addSubscription(
      new SqsSubscription(new Queue(this, 'EscalationSQS'), { rawMessageDelivery: true })
    );

    const output = new Pass(this, 'OutPut', { outputPath: "$.Payload" });
    const escalate = new LambdaInvoke(this, 'EscaleteCaseState', { lambdaFunction: escalateCaseLambda })
      .next(new SnsPublish(this, 'PublishToEscalationTopic', { topic, message: TaskInput.fromDataAt('$.Payload'), resultPath: "$.sns" }))
      .next(output)

    const definition = new LambdaInvoke(this, 'OpenCaseState', { lambdaFunction: openCaseLambda })
      .next(new LambdaInvoke(this, 'AssignCaseState', { lambdaFunction: assignCaseLambda }))
      .next(new LambdaInvoke(this, 'HandleCaseState', { lambdaFunction: handleCaseLambda }))
      .next(
        new Choice(this, 'IsCaseResolved')
          .when(Condition.numberEquals('$.Payload.Status', 1), new LambdaInvoke(this, 'CloseCaseState', { lambdaFunction: closeCaseLambda }).next(output))
          .when(Condition.numberEquals('$.Payload.Status', 0), escalate)
      );

    const stateMachine = new StateMachine(this, 'CallCenterStateMachine', {
      stateMachineName: 'CallCenterStateMachine',
      stateMachineType: StateMachineType.EXPRESS,
      logs: {
        destination: new LogGroup(this, 'CallCenterStateMachineLogGroup', { retention: RetentionDays.ONE_DAY })
      },
      tracingEnabled: true,
      definition
    });


    const httpApi = new HttpApi(this, 'StepFuncSyncHttpApi', {
      apiName: 'StepFuncSyncHttpApi'
    });

    const credentialsRole = new Role(this, "RoleV2", {
      assumedBy: new ServicePrincipal("apigateway.amazonaws.com"),
      inlinePolicies: {
        'PolicyV2': new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['states:StartSyncExecution'],
              effect: Effect.ALLOW,
              resources: [stateMachine.stateMachineArn]
            })
          ]
        })
      }
    });

    const integration = new CfnIntegration(this, 'StepFnINteg', {
      apiId: httpApi.apiId,
      integrationType: 'AWS_PROXY',
      connectionType: HttpConnectionType.INTERNET,
      credentialsArn: credentialsRole.roleArn,
      payloadFormatVersion: PayloadFormatVersion.VERSION_1_0.version,
      integrationSubtype: 'StepFunctions-StartSyncExecution',
      requestParameters: {
        Input: "$request.body",
        StateMachineArn: stateMachine.stateMachineArn
      }
    });

    const route = new CfnRoute(this, 'PostRoute', {
      apiId: httpApi.apiId,
      routeKey: HttpRouteKey.with('/start', HttpMethod.POST).key,
      target: `integrations/${integration.ref}`
    });

    new CfnOutput(this, 'SyncApiOutput', {
      value: httpApi.url!!,
      description: 'Api url'
    })
  }
}