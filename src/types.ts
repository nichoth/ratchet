import type { DID } from '@bicycle-codes/crypto-util/types'

export interface Message {
    keys:{  // <-- base64pad encoded keys
        publicKey:string;
    };
    author:DID;
    body:{
        text:string;
    };
}
