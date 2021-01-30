/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context } from 'fabric-contract-api';
import { ChaincodeStub, ClientIdentity } from 'fabric-shim';
import { LaptopAssetContract } from '.';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import winston = require('winston');

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

class TestContext implements Context {
    public stub: sinon.SinonStubbedInstance<ChaincodeStub> = sinon.createStubInstance(ChaincodeStub);
    public clientIdentity: sinon.SinonStubbedInstance<ClientIdentity> = sinon.createStubInstance(ClientIdentity);
    public logger = {
        getLogger: sinon.stub().returns(sinon.createStubInstance(winston.createLogger().constructor)),
        setLevel: sinon.stub(),
     };
}

describe('LaptopAssetContract', () => {

    let contract: LaptopAssetContract;
    let ctx: TestContext;

    beforeEach(() => {
        contract = new LaptopAssetContract();
        ctx = new TestContext();
        ctx.stub.getState.withArgs('1001').resolves(Buffer.from('{"value":"laptop asset 1001 value"}'));
        ctx.stub.getState.withArgs('1002').resolves(Buffer.from('{"value":"laptop asset 1002 value"}'));
    });

    describe('#laptopAssetExists', () => {

        it('should return true for a laptop asset', async () => {
            await contract.laptopAssetExists(ctx, '1001').should.eventually.be.true;
        });

        it('should return false for a laptop asset that does not exist', async () => {
            await contract.laptopAssetExists(ctx, '1003').should.eventually.be.false;
        });

    });

    describe('#createLaptopAsset', () => {

        it('should create a laptop asset', async () => {
            await contract.createLaptopAsset(ctx, '1003', 'laptop asset 1003 value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1003', Buffer.from('{"value":"laptop asset 1003 value"}'));
        });

        it('should throw an error for a laptop asset that already exists', async () => {
            await contract.createLaptopAsset(ctx, '1001', 'myvalue').should.be.rejectedWith(/The laptop asset 1001 already exists/);
        });

    });

    describe('#readLaptopAsset', () => {

        it('should return a laptop asset', async () => {
            await contract.readLaptopAsset(ctx, '1001').should.eventually.deep.equal({ value: 'laptop asset 1001 value' });
        });

        it('should throw an error for a laptop asset that does not exist', async () => {
            await contract.readLaptopAsset(ctx, '1003').should.be.rejectedWith(/The laptop asset 1003 does not exist/);
        });

    });

    describe('#updateLaptopAsset', () => {

        it('should update a laptop asset', async () => {
            await contract.updateLaptopAsset(ctx, '1001', 'laptop asset 1001 new value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1001', Buffer.from('{"value":"laptop asset 1001 new value"}'));
        });

        it('should throw an error for a laptop asset that does not exist', async () => {
            await contract.updateLaptopAsset(ctx, '1003', 'laptop asset 1003 new value').should.be.rejectedWith(/The laptop asset 1003 does not exist/);
        });

    });

    describe('#deleteLaptopAsset', () => {

        it('should delete a laptop asset', async () => {
            await contract.deleteLaptopAsset(ctx, '1001');
            ctx.stub.deleteState.should.have.been.calledOnceWithExactly('1001');
        });

        it('should throw an error for a laptop asset that does not exist', async () => {
            await contract.deleteLaptopAsset(ctx, '1003').should.be.rejectedWith(/The laptop asset 1003 does not exist/);
        });

    });

});
