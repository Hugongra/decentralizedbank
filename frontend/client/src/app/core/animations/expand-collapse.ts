import { animate, state, style, transition, trigger } from '@angular/animations';
import { AnimationCurves, AnimationDurations } from './animation-settings';

// -----------------------------------------------------------------------------------------------------
// @ Expand / collapse Vertically
// -----------------------------------------------------------------------------------------------------
const expandCollapseVertically = trigger('expandCollapseVertically',
    [
        state('void, collapsed',
            style({
                height: '0',
            }),
        ),

        state('*, expanded',
            style('*'),
        ),

        // Prevent the transition if the state is false
        transition('void <=> false, collapsed <=> false, expanded <=> false', []),

        // Transition
        transition('void <=> *, collapsed <=> expanded',
            animate('{{timings}}'),
            {
                params: {
                    timings: `${AnimationDurations.entering} ${AnimationCurves.deceleration}`,
                },
            },
        ),
    ],
);

export { expandCollapseVertically };
