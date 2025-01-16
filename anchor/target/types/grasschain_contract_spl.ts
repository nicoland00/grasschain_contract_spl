/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/grasschain_contract_spl.json`.
 */
export type GrasschainContractSpl = {
  "address": "coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF",
  "metadata": {
    "name": "grasschainContractSpl",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "createContract",
      "docs": [
        "(B) Create the contract => status = Created"
      ],
      "discriminator": [
        244,
        48,
        244,
        178,
        216,
        88,
        122,
        52
      ],
      "accounts": [
        {
          "name": "farmer",
          "writable": true,
          "signer": true
        },
        {
          "name": "contract",
          "docs": [
            "The Contract data"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "farmer"
              }
            ]
          }
        },
        {
          "name": "mint",
          "docs": [
            "The Mint (already created by init_mint)"
          ]
        },
        {
          "name": "escrowVault",
          "docs": [
            "The escrow vault (already created by init_mint)"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "investmentAmount",
          "type": "u64"
        },
        {
          "name": "yieldPercentage",
          "type": "i64"
        }
      ]
    },
    {
      "name": "fundContract",
      "docs": [
        "(C) The investor funds => status = Funded"
      ],
      "discriminator": [
        223,
        48,
        201,
        90,
        160,
        45,
        47,
        118
      ],
      "accounts": [
        {
          "name": "contract",
          "writable": true
        },
        {
          "name": "investor",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "escrowVault",
          "docs": [
            "The escrow from init_mint or from create_contract"
          ],
          "writable": true
        },
        {
          "name": "investorTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initMint",
      "docs": [
        "(A) Initialize a new Mint + its \"escrow vault\" token account",
        "on chain. Similar to \"init_bank\" in your lending code."
      ],
      "discriminator": [
        126,
        176,
        233,
        16,
        66,
        117,
        209,
        125
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "mintAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "signer"
              }
            ]
          }
        },
        {
          "name": "escrowVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "mintAccount"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "decimals",
          "type": "u8"
        }
      ]
    },
    {
      "name": "mintTokensToUser",
      "discriminator": [
        85,
        150,
        103,
        133,
        240,
        87,
        44,
        73
      ],
      "accounts": [
        {
          "name": "signer",
          "docs": [
            "The authority that can mint new tokens. If that's the farmer,",
            "this must match the authority in your initMint instruction."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "mintAccount",
          "docs": [
            "The mint we created with initMint. Must have authority == `signer`."
          ],
          "writable": true
        },
        {
          "name": "recipient",
          "docs": [
            "We will create an ATA for `recipient` if needed",
            "(just a SystemAccount or Signer if you prefer)"
          ]
        },
        {
          "name": "recipientAta",
          "docs": [
            "The ATA for `recipient`. We'll do `init_if_needed` so ephemeral ledger sees it."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "recipient"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "mintAccount"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "settleContract",
      "docs": [
        "(D) Farmer settles => status = Settled"
      ],
      "discriminator": [
        158,
        177,
        168,
        232,
        181,
        0,
        32,
        220
      ],
      "accounts": [
        {
          "name": "contract",
          "writable": true
        },
        {
          "name": "farmer",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "investorTokenAccount",
          "writable": true
        },
        {
          "name": "farmerTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "buybackAmount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "contract",
      "discriminator": [
        172,
        138,
        115,
        242,
        121,
        67,
        183,
        26
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidContractStatus",
      "msg": "Invalid contract status for this operation."
    },
    {
      "code": 6001,
      "name": "insufficientFunds",
      "msg": "Insufficient funds or mismatch with required investment."
    },
    {
      "code": 6002,
      "name": "insufficientBuyback",
      "msg": "Insufficient buyback amount."
    }
  ],
  "types": [
    {
      "name": "contract",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "farmer",
            "type": "pubkey"
          },
          {
            "name": "investor",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "escrowTokenAccount",
            "type": "pubkey"
          },
          {
            "name": "investmentAmount",
            "type": "i64"
          },
          {
            "name": "yieldPercentage",
            "type": "i64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "contractStatus"
              }
            }
          }
        ]
      }
    },
    {
      "name": "contractStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "created"
          },
          {
            "name": "funded"
          },
          {
            "name": "settled"
          }
        ]
      }
    }
  ]
};
