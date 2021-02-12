/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { LaptopAsset } from './laptop-asset';

@Info({title: 'LaptopAssetContract', description: 'My Smart Contract' })
export class LaptopAssetContract extends Contract {

    @Transaction(false)
    @Returns('boolean')
    public async laptopAssetExists(ctx: Context, laptopAssetId: string): Promise<boolean> {
        const data: Uint8Array = await ctx.stub.getState(laptopAssetId);
        return (!!data && data.length > 0);
    }

    @Transaction()
    public async createLaptopAsset(ctx: Context, laptopAssetId: string, value: string, maker: string, model: string, year: number): Promise<void> {
        const exists: boolean = await this.laptopAssetExists(ctx, laptopAssetId);
        if (exists) {
            throw new Error(`The laptop asset ${laptopAssetId} already exists`);
        }
        const hasAccess = await this.hasRole(ctx, ['Manufacturer']);
        if (!hasAccess) {
            throw new Error(`Only manufacturer can create car asset`);
        }
        const laptopAsset: LaptopAsset = new LaptopAsset();
        laptopAsset.value = value;
        const buffer: Buffer = Buffer.from(JSON.stringify(laptopAsset));
        await ctx.stub.putState(laptopAssetId, buffer);
        const eventPayload: Buffer = Buffer.from(`Created asset ${laptopAssetId} (${value})`);
        ctx.stub.setEvent('laptopEvent', eventPayload);
    }

    @Transaction(false)
    @Returns('LaptopAsset')
    public async readLaptopAsset(ctx: Context, laptopAssetId: string): Promise<LaptopAsset> {
        const exists: boolean = await this.laptopAssetExists(ctx, laptopAssetId);
        if (!exists) {
            throw new Error(`The laptop asset ${laptopAssetId} does not exist`);
        }
        const data: Uint8Array = await ctx.stub.getState(laptopAssetId);
        const laptopAsset: LaptopAsset = JSON.parse(data.toString()) as LaptopAsset;
        return laptopAsset;
    }

    @Transaction()
    public async updateLaptopAsset(ctx: Context, laptopAssetId: string, newValue: string, maker: string, model: string, year: number): Promise<void> {
        const exists: boolean = await this.laptopAssetExists(ctx, laptopAssetId);
        if (!exists) {
            throw new Error(`The laptop asset ${laptopAssetId} does not exist`);
        }
        const hasAccess = await this.hasRole(ctx, ['Manufacturer', 'Dealer']);
        if (!hasAccess) {
            throw new Error(`Only manufacturer or dealer can update car asset`);
        }
        const laptopAsset: LaptopAsset = new LaptopAsset();
        laptopAsset.value = newValue;
        const buffer: Buffer = Buffer.from(JSON.stringify(laptopAsset));
        await ctx.stub.putState(laptopAssetId, buffer);
    }

    @Transaction()
    public async deleteLaptopAsset(ctx: Context, laptopAssetId: string): Promise<void> {
        const exists: boolean = await this.laptopAssetExists(ctx, laptopAssetId);
        if (!exists) {
            throw new Error(`The laptop asset ${laptopAssetId} does not exist`);
        }
        const hasAccess = await this.hasRole(ctx, ['Dealer']);
        if (!hasAccess) {
            throw new Error(`Only dealer can delete car asset`);
        }
        await ctx.stub.deleteState(laptopAssetId);
    }

    @Transaction(false)
    public async queryAllAssets(ctx: Context): Promise<string> {
        const startKey = '000';
        const endKey = '999';
        const iterator = await ctx.stub.getStateByRange(startKey, endKey);
        const allResults = [];
        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString());

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString());
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString();
                }
                allResults.push({ Key, Record });
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }
    
    public async hasRole(ctx: Context, roles: string[]) {
        const clientID = ctx.clientIdentity;
        for (const roleName of roles) {
            if (clientID.assertAttributeValue('role', roleName)) {
                if (clientID.getMSPID() === 'Org1MSP' && clientID.getAttributeValue('role') === 'Manufacturer') { return true; }
                if (clientID.getMSPID() === 'Org2MSP' && clientID.getAttributeValue('role') === 'Dealer') { return true; }
            }
        }
        return false;
    }
}


