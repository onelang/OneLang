use strict;
use warnings;

package SomeKind;

use constant {      
    ENUM_VAL0 => 'EnumVal0',
    ENUM_VAL1 => 'EnumVal1',
    ENUM_VAL2 => 'EnumVal2',
};

package TestClass;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    $self->{enum_field} = SomeKind->ENUM_VAL2;
    return $self;
}

sub test_method {
    my ( $self ) = @_;
    print(("Value: @{[$self->{enum_field}]}") . "\n");
}

package Program;

eval {
    my $c = new TestClass();
    $c->test_method();
};
if ($@) {
    print "Exception: " . $@
}