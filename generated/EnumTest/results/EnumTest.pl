use strict;
use warnings;

package TestEnum;

use constant {      
    ITEM1 => 'Item1',
    ITEM2 => 'Item2',
};

package TestClass;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    return $self;
}

sub test_method {
    my ( $self ) = @_;
    my $enum_v = TestEnum->ITEM1;
    if (3 * 2 == 6) {
        $enum_v = TestEnum->ITEM2;
    }
    
    my $check1 = $enum_v eq TestEnum->ITEM2 ? "SUCCESS" : "FAIL";
    my $check2 = $enum_v eq TestEnum->ITEM1 ? "FAIL" : "SUCCESS";
    
    print(("Item1: @{[TestEnum->ITEM1]}, Item2: @{[$enum_v]}, checks: @{[$check1]} @{[$check2]}") . "\n");
}

package Program;

eval {
    my $c = new TestClass();
    $c->test_method();
};
if ($@) {
    print "Exception: " . $@
}