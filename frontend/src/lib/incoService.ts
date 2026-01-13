/** 
 * Mock types for Inco SDK to prevent build errors when package is not installed.
 * In a real environment, these would be imported from @inco-fhevm/sdk
 */
export interface Instance {
    createInput: (contractAddress: string, userAddress: string) => {
        add32: (value: number) => void;
        encrypt: () => Promise<{ data: Uint8Array }>;
    };
}

export class IncoService {
    private static instance: Instance | null = null;

    /**
     * Initialize the Inco SDK instance
     */
    static async getIncoInstance(): Promise<Instance> {
        if (!this.instance) {
            console.warn("⚠️ Inco SDK not installed. Using local mocks for demo.");
            this.instance = {
                createInput: (contractAddress: string, userAddress: string) => ({
                    add32: (value: number) => { },
                    encrypt: async () => ({
                        data: new Uint8Array(32).map(() => Math.floor(Math.random() * 256))
                    })
                })
            };
        }
        return this.instance;
    }

    /**
     * Encrypt a uint32 value for use in FHEVM contracts
     */
    static async encryptUint32(value: number, contractAddress: string, userAddress: string): Promise<Uint8Array> {
        const instance = await this.getIncoInstance();
        const input = instance.createInput(contractAddress, userAddress);
        input.add32(value);
        const { data } = await input.encrypt();
        return data;
    }

    /**
     * Helper to convert Uint8Array to Hex string for contract calls
     */
    static bytesToHex(bytes: Uint8Array): string {
        return '0x' + Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
}
