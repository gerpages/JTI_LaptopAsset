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
    public async createLaptopAsset(ctx: Context, laptopAssetId: string, value: string): Promise<void> {
        const exists: boolean = await this.laptopAssetExists(ctx, laptopAssetId);
        if (exists) {
            throw new Error(`The laptop asset ${laptopAssetId} already exists`);
        }
        const laptopAsset: LaptopAsset = new LaptopAsset();
        laptopAsset.value = value;
        const buffer: Buffer = Buffer.from(JSON.stringify(laptopAsset));
        await ctx.stub.putState(laptopAssetId, buffer);
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
    public async updateLaptopAsset(ctx: Context, laptopAssetId: string, newValue: string): Promise<void> {
        const exists: boolean = await this.laptopAssetExists(ctx, laptopAssetId);
        if (!exists) {
            throw new Error(`The laptop asset ${laptopAssetId} does not exist`);
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

}
