/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/grasschain_contract_spl.json`.
 */
export type GrasschainContractSpl = {
  "address": "2JPFAYWC5FMcNsKNgDxMSq5YZuRfJ6RiMjzVKLScQsTD",
  "metadata": {
    "name": "grasschainContractSpl",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "adminCancel",
      "docs": [
        "(4) Admin cancels => refunds all invests"
      ],
      "discriminator": [
        34,
        225,
        37,
        131,
        38,
        121,
        43,
        237
      ],
      "accounts": [
        {
          "name": "contract",
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
                "path": "contract.admin",
                "account": "contract"
              },
              {
                "kind": "account",
                "path": "contract.contract_id",
                "account": "contract"
              }
            ]
          }
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
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
                  119,
                  45,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "contract"
              }
            ]
          }
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
      "args": []
    },
    {
      "name": "adminWithdraw",
      "docs": [
        "(3) Admin withdraw => contract => Active",
        "Admin has 1 month from funded_time to do this"
      ],
      "discriminator": [
        160,
        166,
        147,
        222,
        46,
        220,
        75,
        224
      ],
      "accounts": [
        {
          "name": "contract",
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
                "path": "contract.admin",
                "account": "contract"
              },
              {
                "kind": "account",
                "path": "contract.contract_id",
                "account": "contract"
              }
            ]
          }
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
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
                  119,
                  45,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "contract"
              }
            ]
          }
        },
        {
          "name": "adminTokenAccount",
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
      "args": []
    },
    {
      "name": "checkMaturity",
      "docs": [
        "(5) Once contract => Active, after start_time + duration, we go => PendingBuyback",
        "This can happen automatically or in a \"check_update\" instruction"
      ],
      "discriminator": [
        221,
        167,
        57,
        208,
        206,
        210,
        34,
        215
      ],
      "accounts": [
        {
          "name": "contract",
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
                "path": "contract.admin",
                "account": "contract"
              },
              {
                "kind": "account",
                "path": "contract.contract_id",
                "account": "contract"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "claimNft",
      "discriminator": [
        6,
        193,
        146,
        120,
        48,
        218,
        69,
        33
      ],
      "accounts": [
        {
          "name": "investor",
          "writable": true,
          "signer": true,
          "relations": [
            "investorRecord"
          ]
        },
        {
          "name": "contract",
          "writable": true
        },
        {
          "name": "investorRecord",
          "writable": true
        },
        {
          "name": "mint",
          "writable": true,
          "signer": true
        },
        {
          "name": "associatedTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "investor"
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
                "path": "mint"
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
          "name": "metadataAccount",
          "writable": true
        },
        {
          "name": "masterEditionAccount",
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
          "name": "tokenMetadataProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "symbol",
          "type": "string"
        },
        {
          "name": "uri",
          "type": "string"
        }
      ]
    },
    {
      "name": "closeContract",
      "discriminator": [
        37,
        244,
        34,
        168,
        92,
        202,
        80,
        106
      ],
      "accounts": [
        {
          "name": "contract",
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
                "path": "contract.admin",
                "account": "contract"
              },
              {
                "kind": "account",
                "path": "contract.contract_id",
                "account": "contract"
              }
            ]
          }
        },
        {
          "name": "admin",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "createContract",
      "docs": [
        "(1) Admin creates a contract => status=Created => 1 month to fill",
        "(1) Admin creates a contract (status = Created) with an off–chain image URL."
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
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "contract",
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
                "path": "admin"
              },
              {
                "kind": "arg",
                "path": "contractId"
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
                  119,
                  45,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "contract"
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
          "name": "totalInvestmentNeeded",
          "type": "u64"
        },
        {
          "name": "yieldPercentage",
          "type": "i64"
        },
        {
          "name": "durationInSeconds",
          "type": "i64"
        },
        {
          "name": "contractId",
          "type": "u64"
        },
        {
          "name": "nftMint",
          "type": "pubkey"
        },
        {
          "name": "farmName",
          "type": "string"
        },
        {
          "name": "farmAddress",
          "type": "string"
        },
        {
          "name": "farmImageUrl",
          "type": "string"
        }
      ]
    },
    {
      "name": "defaultContract",
      "docs": [
        "(8) If admin/farmer fails to repay after prolongation => default"
      ],
      "discriminator": [
        213,
        78,
        242,
        37,
        116,
        191,
        111,
        33
      ],
      "accounts": [
        {
          "name": "contract",
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
                "path": "contract.admin",
                "account": "contract"
              },
              {
                "kind": "account",
                "path": "contract.contract_id",
                "account": "contract"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "expireFunding",
      "docs": [
        "(2b) Expire funding if not fully funded by the 1-month deadline => refunds each investor",
        "This is optional, only if you want to forcibly end the contract if not enough invests"
      ],
      "discriminator": [
        244,
        210,
        25,
        185,
        1,
        167,
        7,
        89
      ],
      "accounts": [
        {
          "name": "contract",
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
                "path": "contract.admin",
                "account": "contract"
              },
              {
                "kind": "account",
                "path": "contract.contract_id",
                "account": "contract"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "investContract",
      "docs": [
        "(2) Investor invests a partial amount."
      ],
      "discriminator": [
        185,
        77,
        47,
        16,
        164,
        138,
        118,
        159
      ],
      "accounts": [
        {
          "name": "contract",
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
                "path": "contract.admin",
                "account": "contract"
              },
              {
                "kind": "account",
                "path": "contract.contract_id",
                "account": "contract"
              }
            ]
          }
        },
        {
          "name": "investor",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenMint"
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
                  119,
                  45,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "contract"
              }
            ]
          }
        },
        {
          "name": "investorTokenAccount",
          "writable": true
        },
        {
          "name": "investorRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  118,
                  101,
                  115,
                  116,
                  111,
                  114,
                  45,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "contract"
              },
              {
                "kind": "account",
                "path": "investor"
              }
            ]
          }
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
      "name": "prolongContract",
      "docs": [
        "(7) Admin can request a 2-week prolongation"
      ],
      "discriminator": [
        77,
        119,
        29,
        191,
        10,
        140,
        123,
        24
      ],
      "accounts": [
        {
          "name": "contract",
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
                "path": "contract.admin",
                "account": "contract"
              },
              {
                "kind": "account",
                "path": "contract.contract_id",
                "account": "contract"
              }
            ]
          }
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "settleInvestor",
      "discriminator": [
        0,
        218,
        182,
        251,
        14,
        103,
        167,
        132
      ],
      "accounts": [
        {
          "name": "contract",
          "docs": [
            "El contrato en sí (PDA)"
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
                "path": "contract.admin",
                "account": "contract"
              },
              {
                "kind": "account",
                "path": "contract.contract_id",
                "account": "contract"
              }
            ]
          }
        },
        {
          "name": "admin",
          "docs": [
            "El admin que firma (se comprueba en tiempo de ejecución)"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "investorRecord",
          "docs": [
            "El record del inversor a liquidar (PDA)"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  118,
                  101,
                  115,
                  116,
                  111,
                  114,
                  45,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "contract"
              },
              {
                "kind": "account",
                "path": "investor"
              }
            ]
          }
        },
        {
          "name": "investor"
        },
        {
          "name": "adminTokenAccount",
          "docs": [
            "La cuenta USDC del admin (source)"
          ],
          "writable": true
        },
        {
          "name": "investorTokenAccount",
          "docs": [
            "La cuenta USDC del inversor (destino)"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "docs": [
            "El programa SPL Token"
          ],
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "verifyFunding",
      "discriminator": [
        231,
        1,
        210,
        10,
        91,
        236,
        233,
        94
      ],
      "accounts": [
        {
          "name": "contract",
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
                "path": "contract.admin",
                "account": "contract"
              },
              {
                "kind": "account",
                "path": "contract.contract_id",
                "account": "contract"
              }
            ]
          }
        },
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
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
    },
    {
      "name": "investorRecord",
      "discriminator": [
        170,
        144,
        39,
        68,
        178,
        31,
        194,
        117
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidContractStatus",
      "msg": "Invalid contract status"
    },
    {
      "code": 6001,
      "name": "invalidTokenMint",
      "msg": "Invalid token mint"
    },
    {
      "code": 6002,
      "name": "insufficientFunds",
      "msg": "Insufficient funds"
    },
    {
      "code": 6003,
      "name": "insufficientBuyback",
      "msg": "Insufficient buyback"
    },
    {
      "code": 6004,
      "name": "contractNotMatured",
      "msg": "Contract not matured"
    },
    {
      "code": 6005,
      "name": "unauthorized",
      "msg": "Unauthorized admin"
    },
    {
      "code": 6006,
      "name": "adminWindowExpired",
      "msg": "Admin window expired"
    },
    {
      "code": 6007,
      "name": "settlementWindowExpired",
      "msg": "Settlement window expired"
    },
    {
      "code": 6008,
      "name": "fundingWindowExpired",
      "msg": "Funding window expired"
    },
    {
      "code": 6009,
      "name": "exceedsContractNeed",
      "msg": "Exceeds total needed"
    },
    {
      "code": 6010,
      "name": "fundingNotExpiredYet",
      "msg": "Funding not expired yet"
    },
    {
      "code": 6011,
      "name": "alreadyFullyFunded",
      "msg": "Already fully funded"
    },
    {
      "code": 6012,
      "name": "invalidStateForProlongOrDefault",
      "msg": "Cannot default or prolong in this state"
    },
    {
      "code": 6013,
      "name": "nftAlreadyClaimed",
      "msg": "NFT already claimed"
    }
  ],
  "types": [
    {
      "name": "contract",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "nftMint",
            "type": "pubkey"
          },
          {
            "name": "escrowTokenAccount",
            "type": "pubkey"
          },
          {
            "name": "farmImageUrl",
            "type": "string"
          },
          {
            "name": "totalInvestmentNeeded",
            "type": "i64"
          },
          {
            "name": "amountFundedSoFar",
            "type": "u64"
          },
          {
            "name": "yieldPercentage",
            "type": "i64"
          },
          {
            "name": "duration",
            "type": "i64"
          },
          {
            "name": "contractId",
            "type": "u64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "contractStatus"
              }
            }
          },
          {
            "name": "uploadDate",
            "type": "i64"
          },
          {
            "name": "fundingDeadline",
            "type": "i64"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "fundedTime",
            "type": "i64"
          },
          {
            "name": "verified",
            "type": "bool"
          },
          {
            "name": "buybackDeadline",
            "type": "i64"
          },
          {
            "name": "prolongedDeadline",
            "type": "i64"
          },
          {
            "name": "farmName",
            "type": "string"
          },
          {
            "name": "farmAddress",
            "type": "string"
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
            "name": "funding"
          },
          {
            "name": "fundedPendingVerification"
          },
          {
            "name": "active"
          },
          {
            "name": "pendingBuyback"
          },
          {
            "name": "prolonged"
          },
          {
            "name": "settled"
          },
          {
            "name": "defaulted"
          },
          {
            "name": "cancelled"
          }
        ]
      }
    },
    {
      "name": "investorRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "contract",
            "type": "pubkey"
          },
          {
            "name": "investor",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "nftMinted",
            "type": "bool"
          },
          {
            "name": "nftMint",
            "type": "pubkey"
          }
        ]
      }
    }
  ]
};
