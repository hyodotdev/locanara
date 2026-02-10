package com.locanara.dsl

// Pipeline steps are integrated into Pipeline's fluent API methods.
// Each method (e.g. .summarize(), .translate()) returns Pipeline<ConcreteOutputType>,
// giving compile-time type safety for the entire pipeline.
