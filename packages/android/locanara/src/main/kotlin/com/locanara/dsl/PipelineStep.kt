package com.locanara.dsl

// Pipeline steps are integrated into Pipeline's fluent API methods.
// Each method (e.g. .summarize(), .translate()) returns Pipeline<ConcreteOutputType>,
// tracking the final step's output type at compile time. Adjacent steps still
// exchange ChainOutput.text and metadata at runtime.
