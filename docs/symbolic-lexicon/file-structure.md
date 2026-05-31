# Tides of Knowing Symbolic Lexicon: File Structure

## Purpose

This document defines where Symbolic Lexicon files live inside the Tides of Knowing website repository.

The purpose is to keep documentation, source data, schemas, indexes, configuration files, and pairing records clearly separated.

## Root folders

Human-readable documentation lives in:

docs/symbolic-lexicon/

Machine-readable source data lives in:

src/data/symbolic-lexicon/

## Documentation files

Use this folder for specifications, workflow documents, and human-readable rules:

docs/symbolic-lexicon/

Initial files:

card-dataset-specification.md
file-structure.md
review-workflow.md

Do not place these documents in src/content because they are not public articles.

Do not place these documents in src/data because they are not machine data.

## Tarot single-card records

Single-card tarot records live in:

src/data/symbolic-lexicon/tarot/cards/

Major Arcana records live in:

src/data/symbolic-lexicon/tarot/cards/major-arcana/

Minor Arcana records live in:

src/data/symbolic-lexicon/tarot/cards/minor-arcana/

Minor Arcana records are grouped by suit:

src/data/symbolic-lexicon/tarot/cards/minor-arcana/wands/
src/data/symbolic-lexicon/tarot/cards/minor-arcana/cups/
src/data/symbolic-lexicon/tarot/cards/minor-arcana/swords/
src/data/symbolic-lexicon/tarot/cards/minor-arcana/pentacles/

Each card should eventually have one canonical JSON record.

Example:

src/data/symbolic-lexicon/tarot/cards/major-arcana/the-fool.json

## Schema files

Schema, template, and example files live in:

src/data/symbolic-lexicon/tarot/schema/

Initial files:

card-record.schema.json
card-record.blank-template.json
card-record.example.the-fool.json

## Index files

Index files live in:

src/data/symbolic-lexicon/tarot/indexes/

Initial files:

tarot-card-index.json
tarot-semantic-tags.json
tarot-lineage-index.json

Indexes are used for retrieval, filtering, navigation, validation, and future tooling.

## Configuration files

Global configuration files live in:

src/data/symbolic-lexicon/tarot/config/

Initial files:

vocabulary-levels.json
publication-flags.json
game-vocabulary-config.json

Configuration files define how tools may read the dataset. They should not be duplicated inside every card record.

## Pairing records

Exact two-card pairing records live separately in:

src/data/symbolic-lexicon/pairings/tarot/

Major Arcana upright pairings will initially live in:

src/data/symbolic-lexicon/pairings/tarot/major-arcana-upright/

Pairing indexes live in:

src/data/symbolic-lexicon/pairings/tarot/indexes/

Single-card records must not contain exact two-card pair meanings.

Pairing records must not duplicate full single-card meanings.

## Boundary rules

Single-card records answer:

What is this card?

Pairing records answer:

What happens when these two specific cards appear together?

Game configuration answers:

How does a tool or game use this data?

Website pages answer:

How is this data published for readers?

These responsibilities should remain separate.
